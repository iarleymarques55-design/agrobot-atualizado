// ── Cliente HTTP e sessão ──
// O token fica no localStorage para a sessão valer em todas as abas.
// O logout chama o backend, que apaga a sessão — o token deixa de ser aceito na hora.

export const API = import.meta.env.VITE_API_URL || '';

const TOKEN_KEY = 'agro_token';
const USER_KEY = 'agro_user';

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Armazenamento bloqueado (ex.: modo privado restrito): segue só em memória
  }
}

export function getToken() {
  return readStorage(TOKEN_KEY);
}

export function getCachedUser() {
  try {
    return JSON.parse(readStorage(USER_KEY));
  } catch {
    return null;
  }
}

export function cacheUser(user) {
  writeStorage(USER_KEY, JSON.stringify(user));
}

export function storeSession(token, user) {
  writeStorage(TOKEN_KEY, token);
  cacheUser(user);
}

export function clearSession() {
  writeStorage(TOKEN_KEY, null);
  writeStorage(USER_KEY, null);
}

export function authHeader() {
  return {
    Authorization: 'Bearer ' + getToken(),
    'Content-Type': 'application/json',
  };
}

/** Mensagem de erro do FastAPI (`detail`), com fallback para outros formatos. */
export function errorMessage(data, fallback) {
  const detail = data?.detail;
  if (typeof detail === 'string' && detail) return detail;
  // Erros 422 do Pydantic vêm como lista de objetos
  if (Array.isArray(detail) && detail[0]?.msg) return fallback;
  return data?.error || fallback;
}

/** POST JSON sem autenticação. Retorna { ok, status, data }. */
export async function postJson(path, body) {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

/** Encerra a sessão no servidor (best effort) e limpa o armazenamento local. */
export async function logoutSession() {
  const token = getToken();
  clearSession();
  if (!token) return;
  try {
    await fetch(`${API}/api/logout`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
    });
  } catch {
    // Sem rede: o token já saiu do navegador e expira sozinho
  }
}
