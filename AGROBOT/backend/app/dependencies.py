"""
dependencies.py — FastAPI dependencies reutilizáveis e rate limiter defensivo.

Limitação conhecida: o rate limiter vive na memória do processo. Ele zera a cada
reinício e não é compartilhado entre instâncias. Para escalar horizontalmente,
troque `_attempts` por um backend compartilhado (ex.: Redis).
"""
import time
from collections import defaultdict
from fastapi import Header, HTTPException, Request, status

from .auth_utils import decode_token
from .database import get_pool

_attempts: dict[str, list[float]] = defaultdict(list)
_last_cleanup: float = time.monotonic()


def get_client_ip(request: Request) -> str:
    """
    Extrai o IP real do cliente atrás do proxy do Railway.

    O cliente pode enviar o próprio X-Forwarded-For com qualquer valor; o proxy
    apenas ACRESCENTA o IP de quem se conectou a ele no final da lista. Por isso
    o único valor confiável é o último — nunca o primeiro.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        if parts:
            return parts[-1]
    return request.client.host if request.client else "unknown"


def check_rate_limit(key: str, max_attempts: int = 10, window_seconds: int = 60):
    """
    Rate limiter em memória por chave com purga periódica para evitar vazamento de memória.
    """
    global _last_cleanup
    now = time.monotonic()

    # Purga periódica a cada 5 minutos ou se o dicionário crescer muito
    if now - _last_cleanup > 300 or len(_attempts) > 1500:
        keys_to_delete = [
            k for k, ts in _attempts.items()
            if not ts or now - ts[-1] > window_seconds
        ]
        for k in keys_to_delete:
            _attempts.pop(k, None)
        _last_cleanup = now

    timestamps = [t for t in _attempts[key] if now - t < window_seconds]
    _attempts[key] = timestamps

    if len(timestamps) >= max_attempts:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas requisições. Aguarde um instante e tente novamente.",
        )
    _attempts[key].append(now)


async def get_token_payload(authorization: str = Header(default="")) -> dict:
    """
    Extrai e valida o Bearer token e confere se a sessão (jti) ainda está ativa.
    Retorna o payload do JWT ou levanta 401.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Não autenticado.")
    payload = decode_token(authorization[7:])
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou expirado.")

    pool = await get_pool()
    async with pool.acquire() as conn:
        active = await conn.fetchval(
            "SELECT 1 FROM sessions WHERE jti=$1 AND user_id=$2::uuid AND expires_at > NOW()",
            payload["jti"], payload["sub"],
        )
    if not active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão encerrada. Faça login novamente.")
    return payload


async def require_auth(authorization: str = Header(default="")) -> str:
    """Retorna o user_id de uma sessão válida ou levanta 401."""
    payload = await get_token_payload(authorization)
    return payload["sub"]
