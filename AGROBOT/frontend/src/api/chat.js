import { API, authHeader, errorMessage } from './client';

// ── Conversas salvas ──

export async function listConversations() {
  const r = await fetch(`${API}/api/conversations`, { headers: authHeader() });
  if (!r.ok) return [];
  const data = await r.json();
  return data.conversations || [];
}

export async function createConversation(title) {
  try {
    const r = await fetch(`${API}/api/conversations`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ title: title || 'Consulta agronômica' }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data.conversation?.id || null;
  } catch {
    return null;
  }
}

export async function saveMessage(convId, role, content) {
  if (!convId || !content || (typeof content === 'string' && !content.trim())) return;
  try {
    await fetch(`${API}/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ role, content }),
    });
  } catch {
    // Falha ao salvar não interrompe o chat
  }
}

export async function listMessages(convId, signal) {
  const r = await fetch(`${API}/api/conversations/${convId}/messages`, {
    headers: authHeader(),
    signal,
  });
  if (!r.ok) return null;
  const data = await r.json();
  return Array.isArray(data.messages) ? data.messages : null;
}

// ── Streaming SSE da IA ──

/**
 * Envia a conversa ao backend e chama `onText(textoAcumulado)` a cada chunk.
 * O system prompt é montado no servidor; aqui só vai o idioma.
 * Retorna o texto final. Pode ser cancelado via `signal`.
 */
export async function streamChat({ messages, lang, maxTokens, signal, onText }) {
  const r = await fetch(`${API}/api/chat`, {
    method: 'POST',
    headers: authHeader(),
    signal,
    body: JSON.stringify({
      messages,
      lang,
      max_tokens: Math.min(Math.max(maxTokens, 500), 2000),
    }),
  });

  if (!r.ok) {
    const errData = await r.json().catch(() => ({}));
    throw new Error(errorMessage(errData, `Erro HTTP ${r.status}`));
  }

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // última linha pode estar incompleta

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const delta = JSON.parse(data)?.delta?.text || '';
        if (delta) {
          accumulated += delta;
          onText(accumulated);
        }
      } catch {
        // Chunk malformado: ignora e segue o stream
      }
    }
  }

  return accumulated;
}
