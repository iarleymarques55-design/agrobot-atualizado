"""
dependencies.py — FastAPI dependencies reutilizáveis e rate limiter defensivo.
"""
import time
from collections import defaultdict
from fastapi import Header, HTTPException, Request, status

from .auth_utils import verify_token

_attempts: dict[str, list[float]] = defaultdict(list)
_last_cleanup: float = time.monotonic()


def get_client_ip(request: Request) -> str:
    """Extrai o IP real do cliente considerando reverse proxies como Cloudflare/Railway/Nginx."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
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


async def require_auth(authorization: str = Header(default="")) -> str:
    """
    Extrai e valida o Bearer token.
    Retorna o user_id ou levanta 401.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Não autenticado.")
    token = authorization[7:]
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou expirado.")
    return user_id
