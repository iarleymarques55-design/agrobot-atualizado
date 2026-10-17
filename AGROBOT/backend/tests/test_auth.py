"""Testes das rotas de autenticação (requerem TEST_DATABASE_URL)."""
import types

import httpx
import jwt
import pytest

from app.routes import auth as auth_routes

from .conftest import latest_code, requires_db

pytestmark = requires_db

EMAIL = "maria@example.com"
OWNER_PW = "senha-da-maria-123"
ATTACKER_PW = "senha-do-atacante-1"


async def register(client, password, name="Maria", email=EMAIL):
    return await client.post("/api/register", json={"name": name, "email": email, "password": password})


async def login(client, password, email=EMAIL):
    return await client.post("/api/login", json={"email": email, "password": password})


async def register_and_verify(client, password=OWNER_PW, email=EMAIL):
    await register(client, password, email=email)
    r = await client.post("/api/verify-email", json={"email": email, "code": await latest_code(email)})
    assert r.status_code == 200
    return r.json()["token"]


def fake_google(monkeypatch, claims: dict, status_code: int = 200):
    """Substitui o httpx usado em routes/auth.py por um que devolve um id_token com `claims`."""
    # A assinatura não é verificada pelo backend (o token vem direto do Google via TLS)
    id_token = jwt.encode(claims, "chave-falsa-do-google-com-32-bytes-ou-mais", algorithm="HS256")

    class FakeClient:
        def __init__(self, *a, **kw):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def post(self, url, data=None, **kw):
            assert data["client_secret"] == "agrobot-client-secret"
            return httpx.Response(status_code, json={"id_token": id_token, "access_token": "x"})

    monkeypatch.setattr(
        auth_routes, "httpx", types.SimpleNamespace(AsyncClient=FakeClient, RequestError=httpx.RequestError)
    )


def google_claims(**overrides):
    claims = {
        "iss": "https://accounts.google.com",
        "aud": "agrobot-client-id",
        "sub": "google-sub-123",
        "email": EMAIL,
        "email_verified": True,
        "name": "Maria Google",
    }
    claims.update(overrides)
    return claims


# ── Item 1: roubo de conta por pré-cadastro ─────────────────────
async def test_reregister_does_not_overwrite_unverified_password(client):
    await register(client, ATTACKER_PW)          # atacante pré-cadastra o e-mail
    await register(client, OWNER_PW)             # recadastro: senha nova fica só pendente

    # Sem confirmar o código, a senha nova ainda não vale
    assert (await login(client, OWNER_PW)).status_code == 401


async def test_pending_password_applies_only_after_code_confirmation(client):
    await register(client, ATTACKER_PW)
    await register(client, OWNER_PW)
    code = await latest_code(EMAIL)
    r = await client.post("/api/verify-email", json={"email": EMAIL, "code": code})
    assert r.status_code == 200

    assert (await login(client, OWNER_PW)).status_code == 200
    assert (await login(client, ATTACKER_PW)).status_code == 401


async def test_google_login_discards_password_of_unverified_preregistration(client, monkeypatch):
    await register(client, ATTACKER_PW)
    fake_google(monkeypatch, google_claims())

    r = await client.post("/api/google-auth-code", json={"code": "abc"})
    assert r.status_code == 200
    assert r.json()["user"]["email_verified"] is True

    # A senha escolhida pelo atacante não dá mais acesso à conta
    assert (await login(client, ATTACKER_PW)).status_code == 401


async def test_google_login_keeps_password_of_verified_account(client, monkeypatch):
    await register_and_verify(client)
    fake_google(monkeypatch, google_claims())

    assert (await client.post("/api/google-auth-code", json={"code": "abc"})).status_code == 200
    assert (await login(client, OWNER_PW)).status_code == 200


# ── Item 2: tokens do Google de outro aplicativo ────────────────
async def test_google_rejects_token_for_another_app(client, monkeypatch):
    fake_google(monkeypatch, google_claims(aud="outro-app"))
    r = await client.post("/api/google-auth-code", json={"code": "abc"})
    assert r.status_code == 401


async def test_google_rejects_unverified_google_email(client, monkeypatch):
    fake_google(monkeypatch, google_claims(email_verified=False))
    r = await client.post("/api/google-auth-code", json={"code": "abc"})
    assert r.status_code == 401


async def test_access_token_endpoint_no_longer_exists(client):
    r = await client.post("/api/google-auth", json={"access_token": "token-de-outro-site"})
    assert r.status_code in (404, 405)


# ── Item 5: logout invalida o token ─────────────────────────────
async def test_logout_revokes_token(client):
    token = await register_and_verify(client)
    headers = {"Authorization": f"Bearer {token}"}

    assert (await client.get("/api/me", headers=headers)).status_code == 200
    assert (await client.post("/api/logout", headers=headers)).status_code == 200
    assert (await client.get("/api/me", headers=headers)).status_code == 401


# ── Item 7: enumeração de e-mails ───────────────────────────────
async def test_register_and_resend_do_not_reveal_existing_accounts(client):
    await register_and_verify(client)

    existing = await register(client, "outra-senha-123")
    new = await register(client, "outra-senha-123", email="novo@example.com")
    assert existing.status_code == new.status_code == 201
    assert existing.json()["message"] == new.json()["message"]

    known = await client.post("/api/send-verification", json={"email": EMAIL})
    unknown = await client.post("/api/send-verification", json={"email": "ninguem@example.com"})
    assert known.status_code == unknown.status_code == 200
    assert known.json()["message"] == unknown.json()["message"]


async def test_verify_code_alias_removed(client):
    r = await client.post("/api/verify-code", json={"email": EMAIL, "code": "123456"})
    assert r.status_code == 404


# ── Item 12: erros vêm no campo `detail` ────────────────────────
async def test_errors_are_returned_in_detail_field(client):
    r = await register(client, "x" * 200)
    assert r.status_code == 400
    assert r.json()["detail"] == "Senha muito longa."


# ── Item 16: "plan" não é editável; profissão tem coluna própria ─
async def test_profile_update_cannot_change_plan(client):
    token = await register_and_verify(client)
    headers = {"Authorization": f"Bearer {token}"}

    r = await client.put(
        "/api/me", headers=headers,
        json={"profession": "Engenheiro Agrônomo", "plan": "pro"},
    )
    assert r.status_code == 200
    user = r.json()["user"]
    assert user["profession"] == "Engenheiro Agrônomo"
    assert user["plan"] == "free"
