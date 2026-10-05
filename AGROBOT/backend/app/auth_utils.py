"""
auth_utils.py — Helpers de JWT e hash de senha.
"""
import os
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

JWT_SECRET = os.getenv("JWT_SECRET", "")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET não configurado! Defina esta variável de ambiente.")

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7  # reduzido de 30 para 7 dias


# ── JWT ──────────────────────────────────────────────────────
def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> str | None:
    """Retorna user_id (sub) ou None se inválido."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


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
