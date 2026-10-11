"""
routes/chat.py — Proxy SSE para a API Groq (streaming).

Faz o papel do proxy que o Node.js original fazia: recebe a request do
frontend, encaminha para o Groq com streaming e repassa os chunks SSE.
"""
import os
import json

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Any

from ..dependencies import require_auth, check_rate_limit

router = APIRouter(prefix="/api", tags=["chat"])

GROQ_API_KEY      = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL_TEXT   = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
GROQ_MODEL_VISION = os.getenv("GROQ_MODEL_VISION", "qwen/qwen3.8-27b")
GROQ_BASE_URL     = "https://api.groq.com/openai/v1/chat/completions"


# ── Schema ───────────────────────────────────────────────────
_MAX_MESSAGES = 40       # janela de contexto m\u00e1xima
_MAX_CONTENT_CHARS = 8000  # por mensagem (anti-spam / DoS)
_MAX_SYSTEM_CHARS = 4000

class ChatBody(BaseModel):
    messages: list[dict[str, Any]]
    system: str | None = None
    max_tokens: int = 1500
    stream: bool = True

    def validated(self) -> "ChatBody":
        """Aplica limites de tamanho, valida imagens e sanitiza o payload."""
        if len(self.messages) > _MAX_MESSAGES:
            self.messages = self.messages[-_MAX_MESSAGES:]
        for m in self.messages:
            c = m.get("content", "")
            if isinstance(c, str) and len(c) > _MAX_CONTENT_CHARS:
                m["content"] = c[:_MAX_CONTENT_CHARS]
            # SEC-06: Validação de imagens (máx 4 por mensagem, máx ~7MB base64 cada)
            elif isinstance(c, list):
                _MAX_IMAGES = 4
                _MAX_IMG_BYTES = 7 * 1024 * 1024  # ~7MB em base64
                img_count = 0
                cleaned_parts = []
                for part in c:
                    if part.get("type") == "image_url":
                        img_count += 1
                        if img_count > _MAX_IMAGES:
                            continue  # ignora imagens além do limite
                        url = part.get("image_url", {}).get("url", "")
                        if len(url) > _MAX_IMG_BYTES:
                            continue  # ignora imagem maior que 7MB
                        cleaned_parts.append(part)
                    else:
                        text_val = part.get("text", "")
                        if len(text_val) > _MAX_CONTENT_CHARS:
                            part["text"] = text_val[:_MAX_CONTENT_CHARS]
                        cleaned_parts.append(part)
                m["content"] = cleaned_parts
        if self.system and len(self.system) > _MAX_SYSTEM_CHARS:
            self.system = self.system[:_MAX_SYSTEM_CHARS]
        self.max_tokens = min(max(self.max_tokens, 200), 2000)
        return self


def _convert_parts(parts: list) -> list:
    """Normaliza content parts para o formato Groq."""
    result = []
    for p in parts:
        if p.get("type") == "image_url":
            result.append({"type": "image_url", "image_url": {"url": p["image_url"]["url"]}})
        else:
            result.append({"type": "text", "text": p.get("text", "")})
    return result


def _build_groq_messages(body: ChatBody) -> tuple[list, bool]:
    """Constrói a lista de mensagens para o Groq. Retorna (messages, has_images)."""
    has_images = False
    messages = []

    if body.system:
        messages.append({"role": "system", "content": body.system})

    for m in body.messages:
        content = m.get("content", "")
        role = m.get("role", "user")
        if isinstance(content, list):
            # Detecta imagens
            if any(p.get("type") == "image_url" for p in content):
                has_images = True
            if role == "assistant":
                # Groq não aceita image_url em mensagens do assistant
                text_only = " ".join(p.get("text", "") for p in content if p.get("type") == "text")
                messages.append({"role": role, "content": text_only})
            else:
                messages.append({"role": role, "content": _convert_parts(content)})
        else:
            messages.append({"role": role, "content": content})

    return messages, has_images


FALLBACK_MODELS = [
    os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b"),
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
]


async def _stream_groq(groq_payload: dict):
    """Gerador assíncrono: tenta o modelo primário e faz fallback em caso de Rate Limit (429)."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}",
    }

    # Modelos a tentar em ordem caso o primeiro atinja limite de taxa
    primary_model = groq_payload.get("model")
    models_to_try = [primary_model] + [m for m in FALLBACK_MODELS if m != primary_model]

    async with httpx.AsyncClient(timeout=120.0) as client:
        for idx, model_name in enumerate(models_to_try):
            current_payload = dict(groq_payload)
            current_payload["model"] = model_name
            # Para modelos com limites menores por minuto, mantemos uma reserva segura de tokens
            if "qwen" in model_name:
                current_payload["max_tokens"] = min(current_payload.get("max_tokens", 600), 600)

            async with client.stream("POST", GROQ_BASE_URL, json=current_payload, headers=headers) as resp:
                # Se for 429 (Rate limit) e ainda tivermos modelos de fallback, tenta o próximo!
                if resp.status_code == 429 and idx < len(models_to_try) - 1:
                    continue

                if resp.status_code != 200:
                    raw_body = await resp.aread()
                    err_text = raw_body.decode(errors="ignore")
                    try:
                        err_json = json.loads(err_text)
                        err_msg = err_json.get("error", {}).get("message", err_text)
                    except Exception:
                        err_msg = err_text
                    # SEC-09: Sanitiza mensagem de erro — não expõe detalhes internos do Groq
                    safe_messages = {
                        429: "Limite de requisições atingido. Aguarde um momento e tente novamente.",
                        401: "Erro de autenticação com o serviço de IA.",
                        403: "Acesso negado pelo serviço de IA.",
                    }
                    safe_msg = safe_messages.get(resp.status_code, f"Erro temporário no serviço de IA (código {resp.status_code}). Tente novamente.")
                    chunk = json.dumps({
                        "type": "content_block_delta",
                        "delta": {"type": "text_delta", "text": f"⚠️ {safe_msg}"},
                    })
                    yield f"data: {chunk}\n\n"
                    yield "data: [DONE]\n\n"
                    return

                # Streaming bem sucedido do modelo
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:].strip()
                    if not data or data == "[DONE]":
                        continue
                    try:
                        parsed = json.loads(data)
                        delta = parsed.get("choices", [{}])[0].get("delta", {})
                        delta_text = delta.get("content") or ""
                        if not delta_text and delta.get("channel") != "analysis":
                            delta_text = delta.get("reasoning", "")
                        
                        if delta_text:
                            chunk = json.dumps({
                                "type": "content_block_delta",
                                "delta": {"type": "text_delta", "text": delta_text},
                            })
                            yield f"data: {chunk}\n\n"
                    except Exception:
                        pass
                yield "data: [DONE]\n\n"
                return


# ── POST /api/chat ────────────────────────────────────────────
@router.post("/chat")
async def chat(body: ChatBody, request: Request, user_id: str = Depends(require_auth)):
    # SEC-02: Rate limit por usuário autenticado — máx 15 requisições/minuto
    check_rate_limit(f"chat:user:{user_id}", max_attempts=15, window_seconds=60)
    if not GROQ_API_KEY:
        raise HTTPException(500, "GROQ_API_KEY n\u00e3o configurada no servidor.")

    body = body.validated()  # aplica limites de tamanho e sanitiza
    messages, has_images = _build_groq_messages(body)
    model = GROQ_MODEL_VISION if has_images else GROQ_MODEL_TEXT

    groq_payload = {
        "model": model,
        "messages": messages,
        "max_tokens": min(max(body.max_tokens, 500), 2000),
        "temperature": 0.7,
        "stream": True,
    }

    return StreamingResponse(
        _stream_groq(groq_payload),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
