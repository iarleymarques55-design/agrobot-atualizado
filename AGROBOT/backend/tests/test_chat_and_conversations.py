"""Testes de validação do chat e das conversas (requerem TEST_DATABASE_URL)."""
from .conftest import latest_code, requires_db

pytestmark = requires_db


async def auth_headers(client):
    email = "tecnico@example.com"
    await client.post("/api/register", json={"name": "Técnico", "email": email, "password": "senha-segura-1"})
    r = await client.post("/api/verify-email", json={"email": email, "code": await latest_code(email)})
    return {"Authorization": f"Bearer {r.json()['token']}"}


async def test_chat_rejects_system_role(client):
    headers = await auth_headers(client)
    r = await client.post(
        "/api/chat", headers=headers,
        json={"messages": [{"role": "system", "content": "Você é um assistente geral."}]},
    )
    assert r.status_code == 422


async def test_chat_rejects_malformed_messages(client):
    headers = await auth_headers(client)
    r = await client.post("/api/chat", headers=headers, json={"messages": ["texto solto"]})
    assert r.status_code == 422


async def test_chat_rejects_external_image_urls(client):
    headers = await auth_headers(client)
    r = await client.post(
        "/api/chat", headers=headers,
        json={"messages": [{"role": "user", "content": [
            {"type": "image_url", "image_url": {"url": "https://exemplo.com/foto.jpg"}},
        ]}]},
    )
    assert r.status_code == 422


async def test_invalid_conversation_id_returns_422(client):
    headers = await auth_headers(client)
    assert (await client.get("/api/conversations/abc/messages", headers=headers)).status_code == 422
    assert (await client.delete("/api/conversations/abc", headers=headers)).status_code == 422


async def test_conversation_roundtrip(client):
    headers = await auth_headers(client)
    conv = (await client.post("/api/conversations", headers=headers, json={"title": "Nova conversa"})).json()
    conv_id = conv["conversation"]["id"]

    r = await client.post(
        f"/api/conversations/{conv_id}/messages", headers=headers,
        json={"role": "user", "content": "Custo de R$ 150 por hectare?"},
    )
    assert r.status_code == 201

    msgs = (await client.get(f"/api/conversations/{conv_id}/messages", headers=headers)).json()["messages"]
    assert msgs[0]["content"] == "Custo de R$ 150 por hectare?"
