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


def _ssl_mode(url: str) -> str | None:
    """
    DB_SSL=disable|require|auto (padrão: auto).
    auto → sem SSL para localhost e para a rede privada do Railway (*.railway.internal),
    SSL obrigatório para qualquer outro host remoto.
    """
    mode = os.getenv("DB_SSL", "auto").strip().lower()
    if mode == "disable":
        return None
    if mode == "require":
        return "require"
    is_private = any(h in url for h in ("localhost", "127.0.0.1", ".railway.internal"))
    return None if is_private else "require"


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        url = get_database_url()
        if not url:
            raise RuntimeError(
                "DATABASE_URL não está configurada! Defina a variável de ambiente no seu .env ou painel do Railway."
            )

        _pool = await asyncpg.create_pool(
            dsn=url,
            ssl=_ssl_mode(url),
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
#  Executado em cada startup do servidor (Railway-ready).
#  Colunas novas entram com ADD COLUMN IF NOT EXISTS no final,
#  para que bancos já existentes sejam atualizados sem perda de dados.
# ────────────────────────────────────────────────────────────
_INIT_SQL = """
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           TEXT NOT NULL,
    email          TEXT UNIQUE NOT NULL,
    password_hash  TEXT,
    google_sub     TEXT,
    picture        TEXT,
    plan           TEXT DEFAULT 'free',
    profession     TEXT DEFAULT '',
    registry       TEXT DEFAULT '',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

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

-- Sessões ativas: cada JWT carrega um jti que precisa existir aqui para ser aceito.
-- O logout apaga a linha e invalida o token imediatamente.
CREATE TABLE IF NOT EXISTS sessions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jti        TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de códigos de verificação de email
CREATE TABLE IF NOT EXISTS email_verifications (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                 TEXT NOT NULL,
    code                  TEXT NOT NULL,
    attempts              INT DEFAULT 0,
    pending_name          TEXT,
    pending_password_hash TEXT,
    expires_at            TIMESTAMPTZ NOT NULL,
    used                  BOOLEAN DEFAULT FALSE,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── Migrações incrementais para bancos criados por versões anteriores ──
ALTER TABLE users               ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users               ADD COLUMN IF NOT EXISTS registry TEXT DEFAULT '';
ALTER TABLE users               ADD COLUMN IF NOT EXISTS profession TEXT DEFAULT '';
ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0;
ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS pending_name TEXT;
ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS pending_password_hash TEXT;
ALTER TABLE sessions            ADD COLUMN IF NOT EXISTS jti TEXT;
ALTER TABLE sessions            DROP COLUMN IF EXISTS token;

-- Versões antigas usavam "plan" para guardar a profissão escolhida no perfil.
-- Move esses valores para "profession" e devolve "plan" ao valor padrão.
UPDATE users
   SET profession = plan, plan = 'free'
 WHERE plan IS NOT NULL AND plan NOT IN ('free', 'pro')
   AND COALESCE(profession, '') = '';

DROP INDEX IF EXISTS idx_sessions_token;
CREATE INDEX IF NOT EXISTS idx_conversations_user   ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv        ON messages(conversation_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_jti  ON sessions(jti);
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
