"""
routes/conversations.py — CRUD de conversas e mensagens.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..database import get_pool
from ..dependencies import require_auth

router = APIRouter(prefix="/api", tags=["conversations"])


# ── Schemas ──────────────────────────────────────────────────
class CreateConvBody(BaseModel):
    title: str = "Nova conversa"

class SaveMessageBody(BaseModel):
    role: str
    content: str = ""


# ── GET /api/conversations ────────────────────────────────────
@router.get("/conversations")
async def list_conversations(user_id: str = Depends(require_auth)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id::text, title, created_at FROM conversations "
            "WHERE user_id=$1::uuid ORDER BY created_at DESC LIMIT 50",
            user_id,
        )
    return {"conversations": [dict(r) for r in rows]}


# ── POST /api/conversations ───────────────────────────────────
@router.post("/conversations", status_code=201)
async def create_conversation(body: CreateConvBody, user_id: str = Depends(require_auth)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO conversations (user_id, title) VALUES ($1::uuid,$2) "
            "RETURNING id::text, title, created_at",
            user_id, body.title or "Nova conversa",
        )
    return {"conversation": dict(row)}


# ── DELETE /api/conversations/{conv_id} ──────────────────────
@router.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str, user_id: str = Depends(require_auth)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "DELETE FROM conversations WHERE id=$1::uuid AND user_id=$2::uuid RETURNING id",
            conv_id, user_id,
        )
    if not row:
        raise HTTPException(404, "Conversa não encontrada.")
    return {"ok": True}


# ── GET /api/conversations/{conv_id}/messages ─────────────────
@router.get("/conversations/{conv_id}/messages")
async def list_messages(conv_id: str, user_id: str = Depends(require_auth)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        conv = await conn.fetchrow(
            "SELECT id FROM conversations WHERE id=$1::uuid AND user_id=$2::uuid",
            conv_id, user_id,
        )
        if not conv:
            raise HTTPException(404, "Conversa não encontrada.")
        rows = await conn.fetch(
            "SELECT id::text, role, content, created_at FROM messages "
            "WHERE conversation_id=$1::uuid ORDER BY created_at ASC",
            conv_id,
        )
    return {"messages": [dict(r) for r in rows]}


# ── POST /api/conversations/{conv_id}/messages ────────────────
@router.post("/conversations/{conv_id}/messages", status_code=201)
async def save_message(conv_id: str, body: SaveMessageBody, user_id: str = Depends(require_auth)):
    if body.role not in ("user", "assistant"):
        raise HTTPException(400, "role deve ser 'user' ou 'assistant'.")
    if not body.content or not body.content.strip():
        return {"ok": True, "message": None}

    pool = await get_pool()
    async with pool.acquire() as conn:
        conv = await conn.fetchrow(
            "SELECT id, title FROM conversations WHERE id=$1::uuid AND user_id=$2::uuid",
            conv_id, user_id,
        )
        if not conv:
            raise HTTPException(404, "Conversa não encontrada.")

        # Atualiza título automaticamente se ainda é padrão
        if body.role == "user" and conv["title"] == "Nova conversa":
            short_title = body.content[:60].replace("\n", " ")
            await conn.execute(
                "UPDATE conversations SET title=$1 WHERE id=$2::uuid", short_title, conv_id
            )

        row = await conn.fetchrow(
            "INSERT INTO messages (conversation_id, role, content) VALUES ($1::uuid,$2,$3) "
            "RETURNING id::text, role, content, created_at",
            conv_id, body.role, body.content,
        )
    return {"message": dict(row)}
