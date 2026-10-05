"""
routes/auth.py — Registro, login, verificação de email (Brevo), Google OAuth, /me, logout.
"""
import os
import re
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
import httpx

from ..database import get_pool
from ..auth_utils import create_token, hash_password, verify_password
from ..dependencies import require_auth
from ..email_service import send_verification_email, generate_verification_code

router = APIRouter(prefix="/api", tags=["auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

# Tempo de expiração do código de verificação
VERIFICATION_EXPIRY_MINUTES = 15

# Regex de email simples mas robusto
_EMAIL_RE = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')


def _valid_email(email: str) -> bool:
    return bool(_EMAIL_RE.match(email)) and len(email) <= 254


# ── Rate-limiting simples em memória (sem dependência extra) ──────────
# Para produção com múltiplas instâncias, substitua por Redis + slowapi.
import time
from collections import defaultdict

_attempts: dict[str, list[float]] = defaultdict(list)

def _check_rate_limit(key: str, max_attempts: int = 10, window_seconds: int = 60):
    now = time.monotonic()
    timestamps = _attempts[key]
    # Remove tentativas fora da janela
    _attempts[key] = [t for t in timestamps if now - t < window_seconds]
    if len(_attempts[key]) >= max_attempts:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas. Aguarde um momento e tente novamente.",
        )
    _attempts[key].append(now)



# ── Schemas ──────────────────────────────────────────────────
class RegisterBody(BaseModel):
    name: str
    email: str
    password: str

class LoginBody(BaseModel):
    email: str
    password: str

class GoogleAuthBody(BaseModel):
    id_token: str  # Google ID Token — verificado server-side

class SendVerificationBody(BaseModel):
    email: str

class VerifyEmailBody(BaseModel):
    email: str
    code: str


# ── GET /api/config ───────────────────────────────────────────
@router.get("/config")
async def get_config():
    return {"googleClientId": GOOGLE_CLIENT_ID}


# ── POST /api/register ────────────────────────────────────────
@router.post("/register", status_code=201)
async def register(body: RegisterBody, request: Request):
    # Rate limit: 5 tentativas por IP por minuto
    _check_rate_limit(f"register:{request.client.host}", max_attempts=5, window_seconds=60)

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

    pool = await get_pool()
    async with pool.acquire() as conn:
        exists = await conn.fetchrow(
            "SELECT id::text, name, email_verified FROM users WHERE email=$1", email
        )
        if exists:
            if exists["email_verified"]:
                raise HTTPException(409, "E-mail já cadastrado e confirmado. Faça login.")
            # Se a conta existe mas NÃO foi verificada, atualiza nome e senha
            pw_hash = hash_password(password)
            user = await conn.fetchrow(
                "UPDATE users SET name=$1, password_hash=$2 WHERE id=$3::uuid "
                "RETURNING id::text, name, email, plan, email_verified",
                name, pw_hash, exists["id"],
            )
        else:
            pw_hash = hash_password(password)
            # Cria o usuário com email_verified=FALSE
            user = await conn.fetchrow(
                "INSERT INTO users (name, email, password_hash, email_verified) "
                "VALUES ($1,$2,$3,FALSE) "
                "RETURNING id::text, name, email, plan, email_verified",
                name, email, pw_hash,
            )

    # Envia o código de verificação imediatamente
    code = generate_verification_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_EXPIRY_MINUTES)

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Invalida códigos anteriores para este email
        await conn.execute(
            "UPDATE email_verifications SET used=TRUE WHERE email=$1 AND used=FALSE",
            email,
        )
        # Insere novo código
        await conn.execute(
            "INSERT INTO email_verifications (email, code, expires_at) VALUES ($1,$2,$3)",
            email, code, expires_at,
        )

    # Envia via Brevo (não bloqueia se falhar)
    await send_verification_email(email, name, code)

    return {
        "ok": True,
        "requires_verification": True,
        "email": email,
        "message": "Código de verificação enviado para o seu e-mail!",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "plan": user["plan"],
            "email_verified": False,
        },
    }


# ── POST /api/send-verification ───────────────────────────────
@router.post("/send-verification")
async def send_verification(body: SendVerificationBody, request: Request):
    """Reenvia ou envia um novo código de verificação para o email."""
    # Rate limit: 3 envios por email por minuto
    _check_rate_limit(f"send-verif:{body.email.lower().strip()}", max_attempts=3, window_seconds=60)

    email = body.email.lower().strip()
    if not email or not _valid_email(email):
        raise HTTPException(400, "E-mail inválido.")

    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id::text, name, email, email_verified FROM users WHERE email=$1",
            email,
        )
        if not user:
            raise HTTPException(404, "Usuário não encontrado.")
        if user["email_verified"]:
            return {"ok": True, "message": "E-mail já verificado."}

        # Invalida códigos anteriores
        await conn.execute(
            "UPDATE email_verifications SET used=TRUE WHERE email=$1 AND used=FALSE",
            email,
        )

        # Gera e insere novo código
        code = generate_verification_code()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_EXPIRY_MINUTES)
        await conn.execute(
            "INSERT INTO email_verifications (email, code, expires_at) VALUES ($1,$2,$3)",
            email, code, expires_at,
        )

    # Envia via Brevo
    sent = await send_verification_email(email, user["name"], code)
    if not sent:
        raise HTTPException(503, "Falha ao enviar e-mail. Tente novamente em instantes.")

    return {"ok": True, "message": f"Código enviado para {email}."}


# ── POST /api/verify-email ────────────────────────────────────
@router.post("/verify-email")
async def verify_email(body: VerifyEmailBody, request: Request):
    """Verifica o código de 6 dígitos enviado ao e-mail do usuário."""
    # Rate limit: 10 tentativas por IP por minuto (anti brute-force do código)
    _check_rate_limit(f"verify:{request.client.host}", max_attempts=10, window_seconds=60)

    email = body.email.lower().strip()
    code = body.code.strip()

    if not email or not code:
        raise HTTPException(400, "E-mail e código são obrigatórios.")

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Busca o código mais recente e ainda não usado
        record = await conn.fetchrow(
            """
            SELECT id, code, expires_at, used
            FROM email_verifications
            WHERE email=$1 AND used=FALSE
            ORDER BY created_at DESC
            LIMIT 1
            """,
            email,
        )

        if not record:
            raise HTTPException(400, "Nenhum código de verificação ativo para este e-mail.")

        if record["used"]:
            raise HTTPException(400, "Código já utilizado. Solicite um novo código.")

        now_utc = datetime.now(timezone.utc)
        expires_at = record["expires_at"]
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if now_utc > expires_at:
            raise HTTPException(400, "Código expirado. Solicite um novo código.")

        if record["code"] != code:
            raise HTTPException(400, "Código incorreto. Verifique o e-mail e tente novamente.")

        # Marca o código como usado e o usuário como verificado
        await conn.execute(
            "UPDATE email_verifications SET used=TRUE WHERE id=$1",
            record["id"],
        )
        user = await conn.fetchrow(
            "UPDATE users SET email_verified=TRUE WHERE email=$1 "
            "RETURNING id::text, name, email, plan, email_verified",
            email,
        )

    token = create_token(str(user["id"]))
    return {
        "ok": True,
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "plan": user["plan"],
            "email_verified": user["email_verified"],
        },
    }


# ── POST /api/login ───────────────────────────────────────────
@router.post("/login")
async def login(body: LoginBody, request: Request):
    # Rate limit: 10 tentativas por IP por minuto
    _check_rate_limit(f"login:{request.client.host}", max_attempts=10, window_seconds=60)

    email = body.email.lower().strip()
    password = body.password

    if not email or not password:
        raise HTTPException(400, "Preencha e-mail e senha.")

    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id::text, name, email, password_hash, plan, email_verified "
            "FROM users WHERE email=$1",
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
        code = generate_verification_code()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_EXPIRY_MINUTES)
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE email_verifications SET used=TRUE WHERE email=$1 AND used=FALSE",
                email,
            )
            await conn.execute(
                "INSERT INTO email_verifications (email, code, expires_at) VALUES ($1,$2,$3)",
                email, code, expires_at,
            )
        await send_verification_email(email, user["name"], code)
        return {
            "token": None,
            "requires_verification": True,
            "email": email,
            "message": "E-mail pendente de confirmação. Enviamos um novo código para o seu e-mail!",
        }

    token = create_token(str(user["id"]))
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "plan": user["plan"],
            "email_verified": user["email_verified"],
        },
    }


# ── POST /api/google-auth ─────────────────────────────────────
@router.post("/google-auth")
async def google_auth(body: GoogleAuthBody, request: Request):
    """Valida o ID Token do Google server-side antes de criar a sessão."""
    _check_rate_limit(f"google-auth:{request.client.host}", max_attempts=10, window_seconds=60)

    if not body.id_token:
        raise HTTPException(400, "ID Token do Google é obrigatório.")

    # Verifica o ID Token junto à API pública do Google
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": body.id_token},
            )
        if resp.status_code != 200:
            raise HTTPException(401, "Token do Google inválido.")
        payload = resp.json()
    except httpx.RequestError:
        raise HTTPException(503, "Não foi possível verificar o token do Google.")

    # Valida audience e issuer
    if GOOGLE_CLIENT_ID and payload.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(401, "Token não pertence a esta aplicação.")
    if payload.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise HTTPException(401, "Token do Google inválido.")

    email = payload.get("email", "").lower().strip()
    sub = payload.get("sub", "")
    name = payload.get("name") or email.split("@")[0]
    picture = payload.get("picture", "")

    if not email or not sub:
        raise HTTPException(400, "Dados do Google incompletos.")

    pool = await get_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT id::text, name, email, plan FROM users WHERE email=$1", email
        )
        if existing:
            await conn.execute(
                "UPDATE users SET google_sub=$1, picture=$2, email_verified=TRUE WHERE email=$3",
                sub, picture, email,
            )
            user = dict(existing)
        else:
            row = await conn.fetchrow(
                "INSERT INTO users (name, email, google_sub, picture, email_verified) "
                "VALUES ($1,$2,$3,$4,TRUE) "
                "RETURNING id::text, name, email, plan",
                name, email, sub, picture,
            )
            user = dict(row)

    token = create_token(str(user["id"]))
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "plan": user["plan"],
            "email_verified": True,
        },
    }


# ── GET /api/me ───────────────────────────────────────────────
@router.get("/me")
async def me(user_id: str = Depends(require_auth)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id::text, name, email, plan, picture, email_verified FROM users WHERE id=$1::uuid",
            user_id,
        )
    if not user:
        raise HTTPException(404, "Usuário não encontrado.")
    return {"user": dict(user)}


# ── POST /api/logout ──────────────────────────────────────────
@router.post("/logout")
async def logout():
    return {"ok": True}
