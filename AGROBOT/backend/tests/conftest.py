"""
Configuração dos testes.

Os testes de rota usam um PostgreSQL de verdade, apontado por TEST_DATABASE_URL
(ex.: postgresql://postgres:senha@localhost:5432/agrobot_test). As tabelas são
criadas automaticamente e TODOS os dados desse banco são apagados a cada teste —
nunca aponte para o banco de desenvolvimento ou produção.
Sem TEST_DATABASE_URL, só os testes unitários rodam.
"""
import os

# Precisa vir antes de importar o app: os módulos leem o ambiente na importação
os.environ["JWT_SECRET"] = "test-secret-with-at-least-32-characters!!"
os.environ["ENV"] = "test"
os.environ["BREVO_API_KEY"] = ""          # nunca envia e-mail de verdade nos testes
os.environ["GROQ_API_KEY"] = "test-key"
os.environ["GOOGLE_CLIENT_ID"] = "agrobot-client-id"
os.environ["GOOGLE_CLIENT_SECRET"] = "agrobot-client-secret"
os.environ["DATABASE_URL"] = os.getenv("TEST_DATABASE_URL", "")
os.environ.setdefault("DB_SSL", "disable")

import httpx
import pytest

from app import dependencies
from app.database import close_pool, get_pool, init_db
from app.main import app

HAS_DB = bool(os.environ["DATABASE_URL"])
requires_db = pytest.mark.skipif(not HAS_DB, reason="defina TEST_DATABASE_URL para rodar os testes de rota")


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    dependencies._attempts.clear()
    yield
    dependencies._attempts.clear()


@pytest.fixture
async def client():
    await init_db()
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("TRUNCATE users, conversations, messages, sessions, email_verifications CASCADE")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    # Cada teste roda num event loop novo: o pool não pode ser reaproveitado entre eles
    await close_pool()


async def latest_code(email: str) -> str:
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchval(
            "SELECT code FROM email_verifications WHERE email=$1 AND used=FALSE "
            "ORDER BY created_at DESC LIMIT 1",
            email,
        )
