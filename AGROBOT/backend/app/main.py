"""
main.py — Ponto de entrada do backend FastAPI para o AgroBot.
Configura lifespan (inicialização do banco de dados), CORS e rotas.
Pronto para execução local e deployment no Railway.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from dotenv import load_dotenv

from .database import init_db, close_pool
from .routes import auth, conversations, chat

load_dotenv()

# Origens permitidas — adicione a URL de produção via variável de ambiente
_RAW_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173",
)
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _RAW_ORIGINS.split(",") if o.strip()]

ENV = os.getenv("ENV", "development")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[APP] Inicializando aplicação e verificando banco de dados...")
    await init_db()
    yield
    print("[APP] Encerrando aplicação e liberando pool de conexões...")
    await close_pool()


app = FastAPI(
    title="AgroBot API",
    description="API do assistente agropecuário inteligente AgroBot",
    version="1.0.0",
    lifespan=lifespan,
    # Desativa Swagger/ReDoc em produção
    docs_url="/docs" if ENV != "production" else None,
    redoc_url="/redoc" if ENV != "production" else None,
    openapi_url="/openapi.json" if ENV != "production" else None,
)


# ── Security Headers Middleware ──────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        if ENV == "production":
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)


# ── CORS Middleware ──────────────────────────────────────────
# NUNCA use allow_origins=["*"] com allow_credentials=True — é proibido pelo CORS spec
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Rotas ────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(conversations.router)
app.include_router(chat.router)


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "AgroBot API",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
