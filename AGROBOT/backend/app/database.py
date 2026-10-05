"""
database.py — Conexão assíncrona com PostgreSQL via asyncpg.
Cria todas as tabelas automaticamente na inicialização (Railway-ready).
"""
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

_pool: asyncpg.Pool | None = None


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL", "").strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    return url


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        url = get_database_url()
        if not url:
            raise RuntimeError(
                "DATABASE_URL não está configurada! Defina a variável de ambiente no seu .env ou painel do Railway."
            )

        # Para localhost / 127.0.0.1 não exigimos SSL; para bancos remotos (como Railway/Supabase/Neon), usamos require
        is_local = "localhost" in url or "127.0.0.1" in url
        ssl_mode = None if is_local else "require"

        _pool = await asyncpg.create_pool(
            dsn=url,
            ssl=ssl_mode,
            min_size=1,
            max_size=10,
        )
    return _pool


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


# ────────────────────────────────────────────────────────────
#  DDL — cria extensão + tabelas caso não existam
#  Executado em cada startup do servidor (Railway-ready)
# ────────────────────────────────────────────────────────────
_INIT_SQL = """
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    google_sub    TEXT,
    picture       TEXT,
    plan          TEXT DEFAULT 'free',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Adiciona a coluna email_verified caso a tabela já exista sem ela
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS conversations (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT DEFAULT 'Nova conversa',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user','assistant')),
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de códigos de verificação de email
CREATE TABLE IF NOT EXISTS email_verifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT NOT NULL,
    code       TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used       BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user   ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv        ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token       ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_email_verif_email    ON email_verifications(email);
"""


async def init_db():
    """Garante que as tabelas existem. Chamado no startup do FastAPI."""
    url = get_database_url()
    if not url:
        print("[DB AVISO] DATABASE_URL não definida. Tabelas não foram criadas. Configure seu .env.")
        return

    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(_INIT_SQL)
        print("[DB] Tabelas verificadas/criadas com sucesso no PostgreSQL.")
    except Exception as e:
        print(f"[DB ERRO] Falha ao conectar ou inicializar tabelas: {e}")
        raise e

