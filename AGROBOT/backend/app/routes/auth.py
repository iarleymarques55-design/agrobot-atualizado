"""
routes/auth.py — Registro, login, Google OAuth, /me, logout.
"""
import os
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from ..database import get_pool
from ..auth_utils import create_token, hash_password, verify_password
from ..dependencies import require_auth

router = APIRouter(prefix="/api", tags=["auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


# ── Schemas ──────────────────────────────────────────────────
class RegisterBody(BaseModel):
    name: str
    email: str
    password: str

class LoginBody(BaseModel):
    email: str
    password: str

class GoogleAuthBody(BaseModel):
    name: str | None = None
    email: str
    picture: str | None = None
    sub: str


# ── GET /api/config ───────────────────────────────────────────
@router.get("/config")
async def get_config():
    return {"googleClientId": GOOGLE_CLIENT_ID}


# ── POST /api/register ────────────────────────────────────────
@router.post("/register", status_code=201)
async def register(body: RegisterBody):
    name = body.name.strip()
    email = body.email.lower().strip()
    password = body.password

    if not name or not email or not password:
        raise HTTPException(400, "Preencha todos os campos.")
    if "@" not in email:
        raise HTTPException(400, "E-mail inválido.")
    if len(password) < 8:
        raise HTTPException(400, "Senha mínimo 8 caracteres.")

    pool = await get_pool()
    async with pool.acquire() as conn:
        exists = await conn.fetchrow("SELECT id FROM users WHERE email=$1", email)
        if exists:
            raise HTTPException(409, "E-mail já cadastrado. Faça login.")

        pw_hash = hash_password(password)
        user = await conn.fetchrow(
            "INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) "
            "RETURNING id::text, name, email, plan",
            name, email, pw_hash,
        )

    token = create_token(str(user["id"]))
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "plan": user["plan"]},
    }


# ── POST /api/login ───────────────────────────────────────────
@router.post("/login")
async def login(body: LoginBody):
    email = body.email.lower().strip()
    password = body.password

    if not email or not password:
        raise HTTPException(400, "Preencha e-mail e senha.")

    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id::text, name, email, password_hash, plan FROM users WHERE email=$1", email
        )

    if not user:
        raise HTTPException(401, "E-mail ou senha incorretos.")
    if not user["password_hash"]:
        raise HTTPException(401, "Esta conta usa login pelo Google.")
    if not verify_password(password, user["password_hash"]):
        raise HTTPException(401, "E-mail ou senha incorretos.")

    token = create_token(str(user["id"]))
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "plan": user["plan"]},
    }


# ── POST /api/google-auth ─────────────────────────────────────
@router.post("/google-auth")
async def google_auth(body: GoogleAuthBody):
    email = body.email.lower().strip()
    if not email or not body.sub:
        raise HTTPException(400, "Dados do Google incompletos.")

    pool = await get_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT id::text, name, email, plan FROM users WHERE email=$1", email
        )
        if existing:
            await conn.execute(
                "UPDATE users SET google_sub=$1, picture=$2 WHERE email=$3",
                body.sub, body.picture or "", email,
            )
            user = dict(existing)
        else:
            display_name = body.name or email.split("@")[0]
            row = await conn.fetchrow(
                "INSERT INTO users (name, email, google_sub, picture) VALUES ($1,$2,$3,$4) "
                "RETURNING id::text, name, email, plan",
                display_name, email, body.sub, body.picture or "",
            )
            user = dict(row)

    token = create_token(str(user["id"]))
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "plan": user["plan"]},
    }


# ── GET /api/me ───────────────────────────────────────────────
@router.get("/me")
async def me(user_id: str = Depends(require_auth)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id::text, name, email, plan, picture FROM users WHERE id=$1::uuid",
            user_id,
        )
    if not user:
        raise HTTPException(404, "Usuário não encontrado.")
    return {"user": dict(user)}


# ── POST /api/logout ──────────────────────────────────────────
@router.post("/logout")
async def logout():
    return {"ok": True}
