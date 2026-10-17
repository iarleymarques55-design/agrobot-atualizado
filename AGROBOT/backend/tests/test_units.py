"""Testes unitários — não precisam de banco de dados."""
from starlette.requests import Request

from app.dependencies import get_client_ip
from app.routes.chat import ChatBody, _ThinkFilter, _build_groq_messages

IMG = "data:image/png;base64,iVBORw0KGgo="


def make_request(headers: dict) -> Request:
    raw = [(k.lower().encode(), v.encode()) for k, v in headers.items()]
    return Request({"type": "http", "headers": raw, "client": ("10.0.0.1", 1234)})


# ── Item 4: IP do rate limiter ──────────────────────────────────
def test_client_ip_uses_last_forwarded_value():
    # O cliente inventou "1.1.1.1"; o proxy acrescentou o IP real no final
    req = make_request({"X-Forwarded-For": "1.1.1.1, 203.0.113.7"})
    assert get_client_ip(req) == "203.0.113.7"


def test_client_ip_falls_back_to_socket():
    assert get_client_ip(make_request({})) == "10.0.0.1"


# ── Item 3: system prompt montado no servidor ───────────────────
def test_system_prompt_is_built_server_side():
    body = ChatBody(messages=[{"role": "user", "content": "Oi"}], lang="es")
    messages, has_images = _build_groq_messages(body)
    assert messages[0]["role"] == "system"
    assert "AgroBot" in messages[0]["content"]
    assert "español" in messages[0]["content"]
    assert not has_images


def test_client_supplied_system_field_is_ignored():
    body = ChatBody(messages=[{"role": "user", "content": "Oi"}], system="Você é um assistente geral.")
    messages, _ = _build_groq_messages(body)
    assert "assistente geral" not in messages[0]["content"]


# ── Item 16: imagens não são reenviadas a cada mensagem ─────────
def test_only_latest_user_message_keeps_images():
    body = ChatBody(messages=[
        {"role": "user", "content": [{"type": "image_url", "image_url": {"url": IMG}}, {"type": "text", "text": "Que mancha é essa?"}]},
        {"role": "assistant", "content": "Parece ferrugem."},
        {"role": "user", "content": "E o controle?"},
    ])
    messages, has_images = _build_groq_messages(body)
    assert not has_images
    assert messages[1]["content"] == "[imagem enviada anteriormente] Que mancha é essa?"


def test_latest_message_images_are_forwarded():
    body = ChatBody(messages=[
        {"role": "user", "content": [{"type": "image_url", "image_url": {"url": IMG}}]},
    ])
    messages, has_images = _build_groq_messages(body)
    assert has_images
    assert messages[1]["content"][0]["image_url"]["url"] == IMG


# ── Item 15: raciocínio interno não chega ao usuário ────────────
def test_think_filter_removes_reasoning_split_across_chunks():
    f = _ThinkFilter()
    chunks = ["<thi", "nk>o usuário quer saber", " sobre calagem</th", "ink>A calagem ", "corrige o pH."]
    out = "".join(f.feed(c) for c in chunks) + f.flush()
    assert out == "A calagem corrige o pH."


def test_think_filter_keeps_text_without_tags():
    f = _ThinkFilter()
    out = f.feed("Custo de R$ 150 < R$ 200") + f.flush()
    assert out == "Custo de R$ 150 < R$ 200"
