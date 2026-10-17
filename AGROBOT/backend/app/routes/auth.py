"""
routes/auth.py — Registro, login, verificação de email (Brevo), Google OAuth, /me, logout.
"""
import os
import re
from datetime import datetime, timezone, timedelta

import httpx
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from ..database import get_pool
from ..auth_utils import create_token, hash_password, verify_password
from ..dependencies import require_auth, get_token_payload, check_rate_limit, get_client_ip
from ..email_service import send_verification_email, generate_verification_code

router = APIRouter(prefix="/api", tags=["auth"])

# Tempo de expiração do código de verificação
VERIFICATION_EXPIRY_MINUTES = 15

# Regex de email simples mas robusto
_EMAIL_RE = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')

# Resposta idêntica para qualquer e-mail, exista ele ou não (evita enumeração de usuários)
_NEUTRAL_CODE_MSG = "Se o e-mail puder receber um código, ele chegará em instantes. Verifique sua caixa de entrada."

_USER_COLUMNS = (
    "id::text, name, email, plan, COALESCE(profession, '') AS profession, "
    "picture, email_verified, COALESCE(registry, '') AS registry"
)


def _valid_email(email: str) -> bool:
    return bool(_EMAIL_RE.match(email)) and len(email) <= 254


# ── Schemas ──────────────────────────────────────────────────
class RegisterBody(BaseModel):
    name: str = Field(max_length=200)
    email: str = Field(max_length=254)
    password: str = Field(max_length=1024)

class LoginBody(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=1024)

class GoogleAuthCodeBody(BaseModel):
    code: str = Field(max_length=2048)  # Authorization Code do fluxo OAuth2 popup

class SendVerificationBody(BaseModel):
    email: str = Field(max_length=254)

class VerifyEmailBody(BaseModel):
    email: str = Field(max_length=254)
    code: str = Field(max_length=12)

class UpdateProfileBody(BaseModel):
    name: str | None = None
    profession: str | None = None
    registry: str | None = None


# ── Helpers ──────────────────────────────────────────────────
async def _issue_session(conn, user_id: str) -> str:
    """Cria o JWT, registra o jti em `sessions` e limpa sessões expiradas do usuário."""
    token, jti, expires_at = create_token(user_id)
    await conn.execute(
        "DELETE FROM sessions WHERE user_id=$1::uuid AND expires_at <= NOW()", user_id
    )
    await conn.execute(
        "INSERT INTO sessions (user_id, jti, expires_at) VALUES ($1::uuid, $2, $3)",
        user_id, jti, expires_at,
    )
    return token


async def _store_new_code(
    conn, email: str, pending_name: str | None = None, pending_password_hash: str | None = None
) -> str:
    """Invalida códigos anteriores do e-mail e grava um novo. Retorna o código gerado."""
    code = generate_verification_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_EXPIRY_MINUTES)
    await conn.execute(
        "UPDATE email_verifications SET used=TRUE WHERE email=$1 AND used=FALSE",
        email,
    )
    await conn.execute(
        "INSERT INTO email_verifications (email, code, expires_at, pending_name, pending_password_hash) "
        "VALUES ($1,$2,$3,$4,$5)",
        email, code, expires_at, pending_name, pending_password_hash,
    )
    return code


# ── GET /api/config ───────────────────────────────────────────
@router.get("/config")
async def get_config():
    return {"googleClientId": os.getenv("GOOGLE_CLIENT_ID", "")}


# ── POST /api/register ────────────────────────────────────────
@router.post("/register", status_code=201)
async def register(body: RegisterBody, request: Request):
    # Rate limit: 5 tentativas por IP por minuto
    check_rate_limit(f"register:{get_client_ip(request)}", max_attempts=5, window_seconds=60)

    name = body.name.strip()[:100]
    email = body.email.lower().strip()
    password = body.password

    if not name or not email or not password:
        raise HTTPException(400, "Preencha todos os campos.")
    if not _valid_email(email):
        raise HTTPException(400, "E-mail inválido.")
    if len(password) < 8:
        raise HTTPException(400, "Senha mínimo 8 caracteres.")
    if len(password) > 128:
        raise HTTPException(400, "Senha muito longa.")

    # Calcula o hash sempre, para que o tempo de resposta não revele se o e-mail existe
    pw_hash = hash_password(password)
    code = None

    pool = await get_pool()
    async with pool.acquire() as conn:
        exists = await conn.fetchrow(
            "SELECT id::text, email_verified FROM users WHERE email=$1", email
        )
        if not exists:
            await conn.execute(
                "INSERT INTO users (name, email, password_hash, email_verified) VALUES ($1,$2,$3,FALSE)",
                name, email, pw_hash,
            )
            code = await _store_new_code(conn, email)
        elif not exists["email_verified"]:
            # Conta ainda não confirmada: NÃO sobrescreve nome/senha agora. Os dados novos ficam
            # pendentes no código e só valem se quem tem acesso ao e-mail confirmar o código.
            code = await _store_new_code(conn, email, pending_name=name, pending_password_hash=pw_hash)
        # Conta já confirmada: não faz nada, mas responde igual (não revela que o e-mail existe)

    if code:
        await send_verification_email(email, name, code)

    return {
        "ok": True,
        "requires_verification": True,
        "email": email,
        "message": _NEUTRAL_CODE_MSG,
    }


# ── POST /api/send-verification ───────────────────────────────
@router.post("/send-verification")
async def send_verification(body: SendVerificationBody, request: Request):
    """Reenvia ou envia um novo código de verificação para o email."""
    email = body.email.lower().strip()
    # Rate limit: 3 envios por e-mail e 10 por IP por minuto
    check_rate_limit(f"send-verif:{email}", max_attempts=3, window_seconds=60)
    check_rate_limit(f"send-verif-ip:{get_client_ip(request)}", max_attempts=10, window_seconds=60)

    if not email or not _valid_email(email):
        raise HTTPException(400, "E-mail inválido.")

    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT name, email_verified FROM users WHERE email=$1",
            email,
        )
        if not user or user["email_verified"]:
            return {"ok": True, "message": _NEUTRAL_CODE_MSG}

        # Mantém nome/senha pendentes do último cadastro, se houver
        pending = await conn.fetchrow(
            "SELECT pending_name, pending_password_hash FROM email_verifications "
            "WHERE email=$1 AND used=FALSE ORDER BY created_at DESC LIMIT 1",
            email,
        )
        code = await _store_new_code(
            conn, email,
            pending_name=pending["pending_name"] if pending else None,
            pending_password_hash=pending["pending_password_hash"] if pending else None,
        )

    await send_verification_email(email, user["name"], code)
    return {"ok": True, "message": _NEUTRAL_CODE_MSG}


# ── POST /api/verify-email ────────────────────────────────────
@router.post("/verify-email")
async def verify_email(body: VerifyEmailBody, request: Request):
    """Verifica o código de 6 dígitos enviado ao e-mail do usuário."""
    # Rate limit: 10 tentativas por IP por minuto (anti brute-force do código)
    check_rate_limit(f"verify:{get_client_ip(request)}", max_attempts=10, window_seconds=60)

    email = body.email.lower().strip()
    code = body.code.strip()

    if not email or not code:
        raise HTTPException(400, "E-mail e código são obrigatórios.")

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Busca o código mais recente e ainda não usado
        record = await conn.fetchrow(
            """
            SELECT id, code, expires_at, attempts, pending_name, pending_password_hash
            FROM email_verifications
            WHERE email=$1 AND used=FALSE
            ORDER BY created_at DESC
            LIMIT 1
            """,
            email,
        )

        if not record:
            raise HTTPException(400, "Nenhum código de verificação ativo para este e-mail.")

        # SEC-03: Bloqueia após 5 tentativas incorretas
        if record["attempts"] >= 5:
            await conn.execute(
                "UPDATE email_verifications SET used=TRUE WHERE id=$1",
                record["id"],
            )
            raise HTTPException(400, "Máximo de tentativas excedido. Solicite um novo código.")

        expires_at = record["expires_at"]
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(400, "Código expirado. Solicite um novo código.")

        if record["code"] != code:
            # Incrementa tentativa e retorna erro
            await conn.execute(
                "UPDATE email_verifications SET attempts = attempts + 1 WHERE id=$1",
                record["id"],
            )
            remaining = 4 - record["attempts"]
            raise HTTPException(400, f"Código incorreto. Você tem {max(remaining, 0)} tentativa(s) restante(s).")

        # Marca o código como usado e o usuário como verificado.
        # Nome/senha pendentes (de um recadastro) só passam a valer agora, com o código confirmado.
        await conn.execute(
            "UPDATE email_verifications SET used=TRUE WHERE id=$1",
            record["id"],
        )
        user = await conn.fetchrow(
            "UPDATE users SET email_verified=TRUE, "
            "name=COALESCE($2, name), password_hash=COALESCE($3, password_hash) "
            f"WHERE email=$1 RETURNING {_USER_COLUMNS}",
            email, record["pending_name"], record["pending_password_hash"],
        )
        if not user:
            raise HTTPException(400, "Nenhum código de verificação ativo para este e-mail.")

        token = await _issue_session(conn, user["id"])

    return {"ok": True, "token": token, "user": dict(user)}


# ── POST /api/login ───────────────────────────────────────────
@router.post("/login")
async def login(body: LoginBody, request: Request):
    # Rate limit: 10 tentativas por IP por minuto
    check_rate_limit(f"login:{get_client_ip(request)}", max_attempts=10, window_seconds=60)

    email = body.email.lower().strip()
    password = body.password

    if not email or not password:
        raise HTTPException(400, "Preencha e-mail e senha.")

    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            f"SELECT {_USER_COLUMNS}, password_hash FROM users WHERE email=$1",
            email,
        )

    # Mensagem genérica — não vaza se o email existe (user enumeration)
    _INVALID = "E-mail ou senha incorretos."
    if not user:
        raise HTTPException(401, _INVALID)
    if not user["password_hash"]:
        raise HTTPException(401, _INVALID)
    if not verify_password(password, user["password_hash"]):
        raise HTTPException(401, _INVALID)

    # Se email não verificado, gera novo código, envia e retorna flag para o frontend redirecionar
    if not user["email_verified"]:
        async with pool.acquire() as conn:
            code = await _store_new_code(conn, email)
        await send_verification_email(email, user["name"], code)
        return {
            "token": None,
            "requires_verification": True,
            "email": email,
            "message": "E-mail pendente de confirmação. Enviamos um novo código para o seu e-mail!",
        }

    async with pool.acquire() as conn:
        token = await _issue_session(conn, user["id"])

    profile = dict(user)
    profile.pop("password_hash", None)
    return {"token": token, "user": profile}


# ── POST /api/google-auth-code ────────────────────────────────
@router.post("/google-auth-code")
async def google_auth_code(body: GoogleAuthCodeBody, request: Request):
    """
    Troca um Authorization Code (fluxo popup OAuth2) por tokens do Google e cria/atualiza a conta.

    Esse é o único fluxo Google aceito: o código só pode ser trocado com o client_secret
    do AgroBot, então um token emitido para outro aplicativo nunca é aceito aqui
    (proteção contra "token substitution").
    """
    check_rate_limit(f"google-auth:{get_client_ip(request)}", max_attempts=10, window_seconds=60)

    if not body.code:
        raise HTTPException(400, "Authorization code do Google é obrigatório.")

    client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")

    if not client_id or not client_secret:
        raise HTTPException(503, "Autenticação Google não configurada no servidor.")

    # Troca o authorization code por tokens
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": body.code,
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": "postmessage",  # obrigatório para ux_mode=popup
                    "grant_type": "authorization_code",
                },
            )
    except httpx.RequestError:
        raise HTTPException(503, "Não foi possível comunicar com o Google.")

    if token_resp.status_code != 200:
        raise HTTPException(401, "Não foi possível trocar o código Google por tokens.")

    id_token = token_resp.json().get("id_token", "")
    if not id_token:
        raise HTTPException(401, "Resposta inválida do Google.")

    # O id_token veio direto do endpoint de token do Google via TLS, autenticado com o
    # nosso client_secret — a especificação OpenID (3.1.3.7) dispensa checar a assinatura
    # nesse caso. Ainda assim conferimos emissor, audiência e e-mail verificado.
    try:
        claims = jwt.decode(id_token, options={"verify_signature": False})
    except jwt.PyJWTError:
        raise HTTPException(401, "Resposta inválida do Google.")

    if claims.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise HTTPException(401, "Token do Google inválido.")
    if claims.get("aud") != client_id:
        raise HTTPException(401, "Token não pertence a esta aplicação.")
    if claims.get("email_verified") is not True:
        raise HTTPException(401, "O e-mail desta conta Google não foi verificado pelo Google.")

    email = (claims.get("email") or "").lower().strip()
    sub = claims.get("sub", "")
    name = claims.get("name") or email.split("@")[0]
    picture = claims.get("picture", "")

    if not email or not sub:
        raise HTTPException(400, "Dados do Google incompletos.")

    return await _upsert_google_user_and_token(email, sub, name, picture)


async def _upsert_google_user_and_token(email: str, sub: str, name: str, picture: str) -> dict:
    """Cria ou atualiza o usuário Google e retorna o token JWT da aplicação."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT id::text, email_verified FROM users WHERE email=$1", email
        )
        if existing:
            if existing["email_verified"]:
                user = await conn.fetchrow(
                    f"UPDATE users SET google_sub=$1, picture=$2 WHERE id=$3::uuid RETURNING {_USER_COLUMNS}",
                    sub, picture, existing["id"],
                )
            else:
                # A conta foi criada por e-mail/senha mas nunca confirmada: qualquer pessoa pode ter
                # feito esse cadastro. O Google acabou de provar quem é o dono do e-mail, então a
                # senha definida por terceiros é descartada e os códigos pendentes são invalidados.
                user = await conn.fetchrow(
                    "UPDATE users SET google_sub=$1, picture=$2, email_verified=TRUE, "
                    f"password_hash=NULL, name=$3 WHERE id=$4::uuid RETURNING {_USER_COLUMNS}",
                    sub, picture, name, existing["id"],
                )
                await conn.execute(
                    "UPDATE email_verifications SET used=TRUE WHERE email=$1 AND used=FALSE",
                    email,
                )
        else:
            user = await conn.fetchrow(
                "INSERT INTO users (name, email, google_sub, picture, email_verified) "
                f"VALUES ($1,$2,$3,$4,TRUE) RETURNING {_USER_COLUMNS}",
                name, email, sub, picture,
            )

        token = await _issue_session(conn, user["id"])

    return {"token": token, "user": dict(user)}


# ── GET /api/me ───────────────────────────────────────────────
@router.get("/me")
async def me(user_id: str = Depends(require_auth)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            f"SELECT {_USER_COLUMNS} FROM users WHERE id=$1::uuid",
            user_id,
        )
    if not user:
        raise HTTPException(404, "Usuário não encontrado.")
    return {"user": dict(user)}


# ── PUT /api/me ───────────────────────────────────────────────
@router.put("/me")
async def update_me(body: UpdateProfileBody, user_id: str = Depends(require_auth)):
    # O campo "plan" (plano de assinatura) NÃO é editável pelo usuário.
    name = body.name.strip()[:100] if body.name is not None else None
    profession = body.profession.strip()[:100] if body.profession is not None else None
    registry = body.registry.strip()[:100] if body.registry is not None else None

    pool = await get_pool()
    async with pool.acquire() as conn:
        updated = await conn.fetchrow(
            f"""
            UPDATE users
            SET name       = COALESCE(NULLIF($1, ''), name),
                profession = COALESCE($2, profession),
                registry   = COALESCE($3, registry)
            WHERE id = $4::uuid
            RETURNING {_USER_COLUMNS}
            """,
            name,
            profession,
            registry,
            user_id,
        )
    if not updated:
        raise HTTPException(404, "Usuário não encontrado.")

    return {"user": dict(updated)}


# ── POST /api/logout ──────────────────────────────────────────
@router.post("/logout")
async def logout(payload: dict = Depends(get_token_payload)):
    """Apaga a sessão: o token deixa de ser aceito imediatamente."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM sessions WHERE jti=$1", payload["jti"])
    return {"ok": True}
