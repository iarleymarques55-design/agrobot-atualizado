"""
main.py — Ponto de entrada do backend FastAPI para o AgroBot.
Configura lifespan (inicialização do banco de dados), CORS e rotas.
Pronto para execução local e deployment no Railway.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .database import init_db, close_pool
from .routes import auth, conversations, chat

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Executado ao iniciar o servidor: cria tabelas no PostgreSQL automaticamente
    print("[APP] Inicializando aplicação e verificando banco de dados...")
    await init_db()
    yield
    # Executado ao encerrar o servidor: fecha conexões do pool
    print("[APP] Encerrando aplicação e liberando pool de conexões...")
    await close_pool()


app = FastAPI(
    title="AgroBot API",
    description="API do assistente agropecuário inteligente AgroBot",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS Middleware ──────────────────────────────────────────
# Permite chamadas do frontend em Vite local ou produção
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
