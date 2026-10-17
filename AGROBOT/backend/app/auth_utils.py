"""
auth_utils.py — Helpers de JWT e hash de senha.
"""
import os
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

JWT_SECRET = os.getenv("JWT_SECRET", "")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET não configurado! Defina esta variável de ambiente.")
if os.getenv("ENV") == "production" and len(JWT_SECRET) < 32:
    raise RuntimeError("Em modo de produção, JWT_SECRET deve ter ao menos 32 caracteres para garantir entropia criptográfica.")

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7  # reduzido de 30 para 7 dias


# ── JWT ──────────────────────────────────────────────────────
def create_token(user_id: str) -> tuple[str, str, datetime]:
    """
    Gera um JWT com um identificador único (jti).
    Retorna (token, jti, expires_at) — o jti é gravado em `sessions` para permitir logout real.
    """
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    jti = uuid.uuid4().hex
    token = jwt.encode({"sub": user_id, "jti": jti, "exp": expire}, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, jti, expire


def decode_token(token: str) -> dict | None:
    """Retorna o payload ({sub, jti, exp}) ou None se o token for inválido/expirado."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None
    if not payload.get("sub") or not payload.get("jti"):
        return None
    return payload


# ── Senha ────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    # bcrypt limita o segredo a 72 bytes por especificação
    pw_bytes = plain.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        pw_bytes = plain.encode("utf-8")[:72]
        return bcrypt.checkpw(pw_bytes, hashed.encode("utf-8"))
    except Exception:
        return False
