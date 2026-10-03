"""
dependencies.py — FastAPI dependencies reutilizáveis.
"""
from fastapi import Header, HTTPException, status

from .auth_utils import verify_token


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
