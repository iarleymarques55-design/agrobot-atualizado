"""
routes/chat.py — Proxy SSE para a API Groq (streaming).

Recebe a conversa do frontend, monta o system prompt do AgroBot no servidor,
encaminha para o Groq com streaming e repassa os chunks SSE.
"""
import os
import re
import json
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator

from ..dependencies import require_auth, check_rate_limit

router = APIRouter(prefix="/api", tags=["chat"])

GROQ_API_KEY      = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL_TEXT   = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
GROQ_MODEL_VISION = os.getenv("GROQ_MODEL_VISION", "qwen/qwen3.8-27b")
GROQ_BASE_URL     = "https://api.groq.com/openai/v1/chat/completions"

# Conectar deve ser rápido; entre um chunk e outro damos mais folga ao modelo
GROQ_TIMEOUT = httpx.Timeout(60.0, connect=10.0)


# ── System prompt (montado SOMENTE no servidor) ──────────────
_LANG_NAMES = {
    "pt-BR": "português brasileiro",
    "en": "English",
    "es": "español",
}


def build_system_prompt(lang: str = "pt-BR") -> str:
    language = _LANG_NAMES.get(lang, _LANG_NAMES["pt-BR"])
    return f"""Você é o AgroBot, um assistente especialista em agronomia e agricultura tropical brasileira. Você tem vasto conhecimento em:
- Solos: interpretação de laudos laboratoriais, saturação de bases (V%), calagem (NC), gessagem, CTC e balanço nutricional Ca/Mg/K
- Fitossanidade: identificação de pragas, fungos, nematoides, viroses e MIP com produtos cadastrados no Agrofit/MAPA
- Irrigação: dimensionamento hídrico, lâmina líquida e bruta, turno de rega e Kc por cultura
- Culturas: soja, milho, algodão, café, cana, feijão, trigo, fruticultura, hortaliças e pastagens
- Prescrição Técnica: elaboração de laudos, receituários agronômicos e planos de manejo completos

Quando o usuário enviar fotos, faça análise detalhada de sintomas visuais, órgãos afetados e hipóteses com limiar de dano econômico.
Responda sempre em {language}. Use negrito para parâmetros técnicos essenciais e seja claro, rigoroso e fundamentado.
Seu escopo é agronomia e temas relacionados ao campo. Se o pedido não tiver relação com isso, explique educadamente que você só atende dúvidas agronômicas.

Diretrizes para Fórmulas e Cálculos Matemáticos:
- NUNCA use notação LaTeX (não use cifrões $ como delimitadores, colchetes \\[, barras invertidas como \\times, \\cdot, \\frac ou sublinhados como _c, _0).
- Escreva fórmulas e expressões matemáticas em texto simples, limpo e legível, usando símbolos comuns como × (ou x), /, +, - e parênteses normais (exemplo: ETc = ET0 × Kc ou NC = (V2 - V1) × CTC / 100).
- Valores em reais devem ser escritos normalmente, como R$ 150,00."""


# ── Schema ───────────────────────────────────────────────────
_MAX_MESSAGES = 40              # janela de contexto enviada ao modelo
_MAX_CONTENT_CHARS = 8000       # por mensagem (anti-spam / DoS)
_MAX_IMAGES = 4                 # por mensagem
_MAX_IMG_CHARS = 7 * 1024 * 1024  # ~7MB em base64 por imagem
_IMAGE_PLACEHOLDER = "[imagem enviada anteriormente]"
_DATA_URL_RE = re.compile(r"^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$")


class ImageUrl(BaseModel):
    url: str = Field(max_length=_MAX_IMG_CHARS)

    @field_validator("url")
    @classmethod
    def must_be_inline_image(cls, v: str) -> str:
        # Só aceita imagens embutidas (JPEG/PNG/WebP em base64) — nada de URLs externas
        if not _DATA_URL_RE.match(v):
            raise ValueError("Imagem deve ser JPEG, PNG ou WebP em base64.")
        return v


class ContentPart(BaseModel):
    type: Literal["text", "image_url"]
    text: str | None = None
    image_url: ImageUrl | None = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]   # "system" nunca é aceito do cliente
    content: str | list[ContentPart]


class ChatBody(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=200)
    lang: Literal["pt-BR", "en", "es"] = "pt-BR"
    max_tokens: int = 1500


def _text_of(parts: list[ContentPart]) -> str:
    return " ".join((p.text or "") for p in parts if p.type == "text").strip()


def _build_groq_messages(body: ChatBody) -> tuple[list, bool]:
    """
    Constrói a lista de mensagens para o Groq. Retorna (messages, has_images).
    Imagens só seguem na ÚLTIMA mensagem do usuário; nas anteriores viram um marcador
    de texto, para que fotos antigas não sejam reenviadas a cada pergunta.
    """
    history = body.messages[-_MAX_MESSAGES:]
    messages = [{"role": "system", "content": build_system_prompt(body.lang)}]
    has_images = False
    last_idx = len(history) - 1

    for idx, m in enumerate(history):
        if isinstance(m.content, str):
            messages.append({"role": m.role, "content": m.content[:_MAX_CONTENT_CHARS]})
            continue

        text = _text_of(m.content)[:_MAX_CONTENT_CHARS]
        images = [p for p in m.content if p.type == "image_url" and p.image_url][:_MAX_IMAGES]

        if m.role == "user" and idx == last_idx and images:
            has_images = True
            parts = [{"type": "image_url", "image_url": {"url": p.image_url.url}} for p in images]
            if text:
                parts.append({"type": "text", "text": text})
            messages.append({"role": "user", "content": parts})
        else:
            # Groq não aceita image_url em mensagens do assistant, e imagens antigas não são reenviadas
            marker = f"{_IMAGE_PLACEHOLDER} " if images else ""
            messages.append({"role": m.role, "content": (marker + text).strip() or _IMAGE_PLACEHOLDER})

    return messages, has_images


class _ThinkFilter:
    """
    Remove blocos <think>...</think> que alguns modelos (ex.: Qwen) emitem no próprio
    `content`. Funciona em streaming, mesmo com a tag quebrada entre dois chunks.
    """
    OPEN, CLOSE = "<think>", "</think>"

    def __init__(self):
        self.buffer = ""
        self.inside = False

    def feed(self, chunk: str) -> str:
        self.buffer += chunk
        out = []
        while self.buffer:
            tag = self.CLOSE if self.inside else self.OPEN
            pos = self.buffer.find(tag)
            if pos >= 0:
                if not self.inside:
                    out.append(self.buffer[:pos])
                self.buffer = self.buffer[pos + len(tag):]
                self.inside = not self.inside
                continue
            # Guarda um possível começo de tag no fim do buffer para o próximo chunk
            keep = 0
            for k in range(min(len(tag) - 1, len(self.buffer)), 0, -1):
                if tag.startswith(self.buffer[-k:]):
                    keep = k
                    break
            if not self.inside:
                out.append(self.buffer[:len(self.buffer) - keep])
            self.buffer = self.buffer[len(self.buffer) - keep:]
            break
        return "".join(out)

    def flush(self) -> str:
        rest = "" if self.inside else self.buffer
        self.buffer = ""
        return rest


def _sse_text(text: str) -> str:
    chunk = json.dumps({
        "type": "content_block_delta",
        "delta": {"type": "text_delta", "text": text},
    })
    return f"data: {chunk}\n\n"


FALLBACK_MODELS = [
    os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b"),
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
]

# SEC-09: mensagens de erro padronizadas — não expõem detalhes internos do Groq
_SAFE_ERRORS = {
    429: "Limite de requisições atingido. Aguarde um momento e tente novamente.",
    401: "Erro de autenticação com o serviço de IA.",
    403: "Acesso negado pelo serviço de IA.",
}


async def _stream_groq(groq_payload: dict):
    """Gerador assíncrono: tenta o modelo primário e faz fallback em caso de Rate Limit (429)."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}",
    }

    # Modelos a tentar em ordem caso o primeiro atinja limite de taxa
    primary_model = groq_payload.get("model")
    models_to_try = [primary_model] + [m for m in FALLBACK_MODELS if m != primary_model]

    try:
        async with httpx.AsyncClient(timeout=GROQ_TIMEOUT) as client:
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
                        await resp.aread()
                        safe_msg = _SAFE_ERRORS.get(
                            resp.status_code,
                            f"Erro temporário no serviço de IA (código {resp.status_code}). Tente novamente.",
                        )
                        yield _sse_text(f"⚠️ {safe_msg}")
                        yield "data: [DONE]\n\n"
                        return

                    # Streaming bem sucedido do modelo.
                    # Só repassamos `content`: o campo `reasoning` (raciocínio interno do modelo)
                    # é descartado, e blocos <think> no content são filtrados.
                    think = _ThinkFilter()
                    async for line in resp.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        data = line[6:].strip()
                        if not data or data == "[DONE]":
                            continue
                        try:
                            parsed = json.loads(data)
                            delta = parsed.get("choices", [{}])[0].get("delta", {})
                            visible = think.feed(delta.get("content") or "")
                        except Exception:
                            continue
                        if visible:
                            yield _sse_text(visible)
                    tail = think.flush()
                    if tail:
                        yield _sse_text(tail)
                    yield "data: [DONE]\n\n"
                    return
    except httpx.TimeoutException:
        yield _sse_text("⚠️ O serviço de IA demorou demais para responder. Tente novamente em instantes.")
        yield "data: [DONE]\n\n"
    except httpx.RequestError:
        yield _sse_text("⚠️ Não foi possível conectar ao serviço de IA. Tente novamente em instantes.")
        yield "data: [DONE]\n\n"


# ── POST /api/chat ────────────────────────────────────────────
@router.post("/chat")
async def chat(body: ChatBody, user_id: str = Depends(require_auth)):
    # SEC-02: Rate limit por usuário autenticado — máx 15 requisições/minuto
    check_rate_limit(f"chat:user:{user_id}", max_attempts=15, window_seconds=60)
    if not GROQ_API_KEY:
        raise HTTPException(500, "GROQ_API_KEY não configurada no servidor.")

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
