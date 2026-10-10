import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const LEAF_SVG = (
  <svg viewBox="0 0 24 24" fill="none" style={{ width: '100%', height: '100%' }}>
    <path
      d="M20.24 3.76c-4.5 0-9.5 2-13 6.5-3.5 4.5-3 10-3 10s5.5.5 10-3c4.5-3.5 6.5-8.5 6.5-13-.25-.25-.5-.5-.5-.5z"
      fill="#104F38"
    />
    <path
      d="M4.24 20.24c4.5-4.5 9-7.5 13.5-9"
      stroke="#4ADE80"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const LEAF_SVG_LIGHT = (
  <svg viewBox="0 0 24 24" fill="none" style={{ width: '100%', height: '100%' }}>
    <path
      d="M20.24 3.76c-4.5 0-9.5 2-13 6.5-3.5 4.5-3 10-3 10s5.5.5 10-3c4.5-3.5 6.5-8.5 6.5-13-.25-.25-.5-.5-.5-.5z"
      fill="#4ADE80"
    />
    <path
      d="M4.24 20.24c4.5-4.5 9-7.5 13.5-9"
      stroke="#08281D"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const DOC_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="agro-history-icon">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const INITIAL_CONVERSATIONS = [
  { id: 'c1', title: 'Quais informações devo o...', date: 'Hoje, 16:01', active: true },
  { id: 'c2', title: 'Qual a recomendação de t...', date: '08/10/2026' },
  { id: 'c3', title: 'Qual a recomendação de t...', date: '05/10/2026' },
  { id: 'c4', title: 'Interpretar laudo de solo: p...', date: '05/10/2026' },
  { id: 'c5', title: 'Quais nutrientes preciso ap...', date: '04/10/2026' },
  { id: 'c6', title: 'Minha lavoura tem pH ácido,...', date: '03/10/2026' },
  { id: 'c7', title: 'Estou vendo manchas nas fo...', date: '03/10/2026' },
  { id: 'c8', title: 'Minha lavoura tem pH ácido,...', date: '03/10/2026' },
  { id: 'c9', title: 'Minha lavoura tem pH ácido,...', date: '03/10/2026' },
];

const SUGGESTIONS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#104F38" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
        <line x1="8.5" y1="2" x2="15.5" y2="2" />
        <line x1="7" y1="16" x2="17" y2="16" />
      </svg>
    ),
    title: 'Análise de solo',
    desc: 'Como interpretar o pH, a saturação por bases e a necessidade de calagem?',
    prompt: 'Como interpretar o pH, a saturação por bases e a necessidade de calagem no solo para a cultura da soja?',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#104F38" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
    title: 'Fitossanidade',
    desc: 'Quais informações devo observar ao identificar manchas nas folhas da soja?',
    prompt: 'Quais informações devo observar ao identificar manchas nas folhas da soja?',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#104F38" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
    title: 'Manejo hídrico',
    desc: 'Quais fatores devo considerar para definir o turno de rega?',
    prompt: 'Quais fatores devo considerar para definir o turno de rega?',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#104F38" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 20h10" />
        <path d="M12 20v-8" />
        <path d="M12 12a5 5 0 0 1 5-5h1a6 6 0 0 1-6 6" />
        <path d="M12 12a5 5 0 0 0-5-5H6a6 6 0 0 0 6 6" />
      </svg>
    ),
    title: 'Adubação',
    desc: 'Como interpretar os resultados da análise de solo para planejar a adubação?',
    prompt: 'Como interpretar os resultados da análise de solo para planejar a adubação?',
  },
];

const TERRAINS_BG = (
  <svg
    viewBox="0 0 1440 320"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="agro-field-contours"
    preserveAspectRatio="none"
  >
    <path
      d="M0 240C240 210 480 270 720 230C960 190 1200 240 1440 200V320H0V240Z"
      fill="#EAF4EC"
      fillOpacity="0.45"
    />
    <path
      d="M0 270C300 230 600 290 900 245C1200 200 1350 260 1440 235V320H0V270Z"
      fill="#DFEEE2"
      fillOpacity="0.55"
    />
    <path
      d="M0 295C360 260 720 310 1080 270C1260 250 1380 280 1440 265V320H0V295Z"
      fill="#D4E8D8"
      fillOpacity="0.65"
    />
    <path
      d="M-20 215C220 185 460 245 700 205C940 165 1180 215 1460 175"
      stroke="#CBE0D0"
      strokeWidth="1.2"
      strokeDasharray="4 4"
      fill="none"
    />
    <path
      d="M-20 245C260 210 540 265 820 225C1100 185 1280 235 1460 210"
      stroke="#BCD7C3"
      strokeWidth="1"
      fill="none"
    />
    <path
      d="M-20 275C320 240 640 290 960 250C1200 220 1360 255 1460 240"
      stroke="#ADD0B6"
      strokeWidth="1.2"
      fill="none"
    />
  </svg>
);

// ── Auth helpers ──
function getToken() {
  return sessionStorage.getItem('agro_token');
}
function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem('agro_user'));
  } catch {
    return null;
  }
}
function authHeader() {
  return {
    Authorization: 'Bearer ' + getToken(),
    'Content-Type': 'application/json',
  };
}

// ── API URL ──
const API = import.meta.env.VITE_API_URL || '';

// ── Markdown formatter ──
function fmtMd(t) {
  if (!t || typeof t !== 'string') return '';
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="agro-code-inline">$1</code>')
    .replace(
      /^### (.+)$/gm,
      '<h3 class="agro-chat-h3">$1</h3>'
    )
    .replace(
      /^## (.+)$/gm,
      '<h2 class="agro-chat-h2">$1</h2>'
    )
    .replace(
      /^- (.+)$/gm,
      '<li class="agro-chat-li">$1</li>'
    )
    .replace(
      /^\d+\. (.+)$/gm,
      '<li class="agro-chat-li">$1</li>'
    )
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function buildSystemPrompt(lang = 'pt-BR') {
  const langMap = {
    'pt-BR': 'português brasileiro',
    en: 'English',
    es: 'español',
  };
  const l = langMap[lang] || 'português brasileiro';
  return `Você é o AgroBot, um assistente especialista em agronomia e agricultura tropical brasileira. Você tem vasto conhecimento em:
- Solos: interpretação de laudos laboratoriais, saturação de bases (V%), calagem (NC), gessagem, CTC e balanço nutricional Ca/Mg/K
- Fitossanidade: identificação de pragas, fungos, nematoides, viroses e MIP com produtos cadastrados no Agrofit/MAPA
- Irrigação: dimensionamento hídrico, lâmina líquida e bruta, turno de rega e Kc por cultura
- Culturas: soja, milho, algodão, café, cana, feijão, trigo, fruticultura, hortaliças e pastagens
- Prescrição Técnica: elaboração de laudos, receituários agronômicos e planos de manejo completos

Quando o usuário enviar fotos, faça análise detalhada de sintomas visuais, órgãos afetados e hipóteses com limiar de dano econômico.
Responda sempre em ${l}. Use negrito para parâmetros técnicos essenciais e seja claro, rigoroso e fundamentado.`;
}

function getSavedSettings() {
  return Object.assign(
    { tokens: 1200, lang: 'pt-BR', compact: false, anim: true },
    JSON.parse(sessionStorage.getItem('agro_settings') || '{}')
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [historyItems, setHistoryItems] = useState(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState('c1');
  const [activeServerId, setActiveServerId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPlan, setEditPlan] = useState('Estudante de Informática');
  const [editReg, setEditReg] = useState('');
  const [settings, setSettings] = useState(getSavedSettings());
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const chatAreaRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const convSnapshotsRef = useRef({});

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/');
      return;
    }
    fetch(`${API}/api/me`, { headers: authHeader() })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        sessionStorage.setItem('agro_user', JSON.stringify(data.user));
        setUser(data.user);
        return loadServerConversations();
      })
      .catch(() => {
        const cached = getUser();
        if (cached) setUser(cached);
        else navigate('/');
      });
  }, [navigate]);

  function scrollBot() {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    scrollBot();
  }, [messages, isTyping]);

  async function loadServerConversations() {
    try {
      const r = await fetch(`${API}/api/conversations`, { headers: authHeader() });
      if (!r.ok) return;
      const data = await r.json();
      const convs = data.conversations || [];
      setHistoryItems((prev) => {
        const ids = new Set(prev.map((x) => x.serverId));
        const newItems = convs
          .filter((c) => !ids.has(c.id))
          .map((c) => ({
            id: `server_${c.id}`,
            title: c.title || 'Consulta agronômica',
            date: c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : 'Hoje',
            serverId: c.id,
          }));
        return [...newItems, ...prev];
      });
    } catch {}
  }

  async function createServerConversation(title) {
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

  async function saveServerMessage(convId, role, content) {
    if (!convId || !content || (typeof content === 'string' && !content.trim())) return;
    try {
      await fetch(`${API}/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ role, content }),
      });
    } catch {}
  }

  async function loadServerConversation(serverId) {
    try {
      const r = await fetch(`${API}/api/conversations/${serverId}/messages`, {
        headers: authHeader(),
      });
      if (!r.ok) return;
      const data = await r.json();
      if (!Array.isArray(data.messages)) return;
      const parsed = data.messages.map((m, i) => ({
        id: `srv_${m.id || i}`,
        role: m.role,
        html: fmtMd(m.content || ''),
        text: m.content || '',
        files: [],
      }));
      setMessages(parsed);
      setShowWelcome(parsed.length === 0);
      setConversationHistory(
        parsed.map((m) => ({
          role: m.role,
          content: m.text,
        }))
      );
    } catch {}
  }

  function showToast(msg) {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3200);
  }

  function handleInput(e) {
    setInputVal(e.target.value);
    setCharCount(e.target.value.length);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px';
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files);
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_IMAGES = 4;

    let accepted = 0;
    files.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        showToast(`Tipo não suportado: ${file.name}. Use JPEG, PNG ou WebP.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        showToast(`Arquivo muito grande: ${file.name} (máx 5MB).`);
        return;
      }
      if (pendingFiles.length + accepted >= MAX_IMAGES) {
        showToast(`Máximo de ${MAX_IMAGES} imagens por mensagem.`);
        return;
      }
      accepted++;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPendingFiles((prev) => [
          ...prev,
          { name: file.name, type: file.type, data: ev.target.result },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  async function sendMessage() {
    const text = inputVal.trim();
    if (!text && pendingFiles.length === 0) return;
    if (isTyping) return;

    let serverId = activeServerId;
    if (!serverId) {
      const snippet = text.slice(0, 36) || 'Análise de amostra';
      serverId = await createServerConversation(snippet);
      if (serverId) {
        setActiveServerId(serverId);
        setHistoryItems((prev) => [
          {
            id: `server_${serverId}`,
            title: snippet,
            date: 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            serverId,
            active: true
          },
          ...prev.map((h) => ({ ...h, active: false })),
        ]);
      }
    }

    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      html: fmtMd(text),
      text,
      files: [...pendingFiles],
    };

    setMessages((prev) => [...prev, userMsg]);
    setShowWelcome(false);
    setInputVal('');
    setCharCount(0);
    const sentFiles = [...pendingFiles];
    setPendingFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Monta content da mensagem do usuário para o formato OpenAI/Groq
    let userContent;
    const imageParts = sentFiles
      .filter((f) => f.type?.startsWith('image/'))
      .map((f) => ({ type: 'image_url', image_url: { url: f.data } }));

    if (imageParts.length > 0) {
      userContent = [
        ...imageParts,
        ...(text ? [{ type: 'text', text }] : []),
      ];
    } else {
      userContent = text;
    }

    // Mantém histórico no formato OpenAI {role, content}
    const newHistory = [
      ...conversationHistory,
      { role: 'user', content: userContent },
    ];
    setConversationHistory(newHistory);
    setIsTyping(true);

    if (serverId) saveServerMessage(serverId, 'user', text);

    // ID do botMsg para atualização incremental (streaming)
    const botId = `b_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: botId, role: 'assistant', html: '', text: '', streaming: true },
    ]);

    try {
      const r = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          messages: newHistory,
          system: buildSystemPrompt(settings.lang),
          max_tokens: Math.min(Math.max(settings.tokens, 500), 2000),
          stream: true,
        }),
      });

      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        throw new Error(errData.error || errData.detail || `Erro HTTP ${r.status}`);
      }

      // Processa SSE streaming
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
            const parsed = JSON.parse(data);
            const delta = parsed?.delta?.text || '';
            if (delta) {
              accumulated += delta;
              const html = fmtMd(accumulated);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botId ? { ...m, html, text: accumulated } : m
                )
              );
            }
          } catch {}
        }
      }

      // Finaliza mensagem (remove flag streaming)
      const finalText = accumulated || 'Sem resposta para esta consulta no momento.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? { ...m, html: fmtMd(finalText), text: finalText, streaming: false }
            : m
        )
      );

      setConversationHistory([
        ...newHistory,
        { role: 'assistant', content: finalText },
      ]);

      if (serverId) saveServerMessage(serverId, 'assistant', finalText);
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? {
                ...m,
                html: `<div class="agro-alert error">${err.message || 'Falha na comunicação técnica.'}</div>`,
                text: err.message,
                streaming: false,
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  }

  function newChat() {
    if (activeConvId && messages.length > 0) {
      convSnapshotsRef.current[activeConvId] = {
        messages,
        history: conversationHistory,
      };
    }
    setMessages([]);
    setConversationHistory([]);
    setActiveConvId(null);
    setActiveServerId(null);
    setShowWelcome(true);
    setHistoryItems((prev) => prev.map((h) => ({ ...h, active: false })));
    setSidebarOpen(false);
  }

  function selectHistory(item) {
    if (activeConvId && messages.length > 0) {
      convSnapshotsRef.current[activeConvId] = {
        messages,
        history: conversationHistory,
      };
    }
    setHistoryItems((prev) =>
      prev.map((h) => ({ ...h, active: h.id === item.id }))
    );
    setActiveConvId(item.id);
    setActiveServerId(item.serverId || null);
    setSidebarOpen(false);

    if (convSnapshotsRef.current[item.id]) {
      const snap = convSnapshotsRef.current[item.id];
      setMessages(snap.messages);
      setConversationHistory(snap.history);
      setShowWelcome(snap.messages.length === 0);
      return;
    }

    if (item.serverId) {
      loadServerConversation(item.serverId);
    }
  }

  function logout() {
    sessionStorage.removeItem('agro_token');
    sessionStorage.removeItem('agro_user');
    navigate('/');
  }

  function openEditModal() {
    const cached = getUser();
    setEditName(user?.name || cached?.name || 'Iarley Marques');
    setEditPlan(user?.plan || cached?.plan || 'Estudante de Informática');
    setEditReg(user?.registry || cached?.registry || '');
    setUserMenuOpen(false);
    setEditModalOpen(true);
  }

  async function updateUser() {
    const cached = getUser();
    const updated = {
      ...(user || cached || {}),
      name: editName,
      plan: editPlan,
      registry: editReg,
    };
    setUser(updated);
    sessionStorage.setItem('agro_user', JSON.stringify(updated));
    showToast('Perfil atualizado com sucesso.');
    setEditModalOpen(false);

    try {
      const r = await fetch(`${API}/api/me`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({ name: editName, plan: editPlan, registry: editReg }),
      });
      if (r.ok) {
        const d = await r.json();
        if (d?.user) {
          setUser(d.user);
          sessionStorage.setItem('agro_user', JSON.stringify(d.user));
        }
      }
    } catch {}
  }

  function saveSettings() {
    sessionStorage.setItem('agro_settings', JSON.stringify(settings));
    setSettingsOpen(false);
    showToast('Preferências salvas.');
  }

  function copyMsg(text) {
    navigator.clipboard.writeText(text).then(() => showToast('Texto copiado para a área de transferência.'));
  }

  function exportChat(ext) {
    setExportOpen(false);
    let out = `AGROBOT - RELATÓRIO DE CONSULTA TÉCNICA\nEmitido em: ${new Date().toLocaleString('pt-BR')}\n\n`;
    messages.forEach((m) => {
      const who = m.role === 'user' ? (user?.name || 'Técnico') : 'AgroBot';
      out += `[${who}]:\n${m.text}\n\n---\n\n`;
    });
    const blob = new Blob([out], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `agrobot_consulta_${Date.now()}.${ext}`;
    a.click();
  }

  function copyAllChat() {
    setExportOpen(false);
    let out = '';
    messages.forEach((m) => {
      const who = m.role === 'user' ? (user?.name || 'Técnico') : 'AgroBot';
      out += `**${who}**:\n${m.text}\n\n`;
    });
    navigator.clipboard.writeText(out).then(() => showToast('Conversa copiada com sucesso.'));
  }

  // ── Geração de PDF Oficial ──
  async function generatePDF(title, text) {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, M = 18, CW = W - M * 2;
    let y = 0;
    const checkPage = (needed) => {
      if (y + needed > 275) {
        doc.addPage();
        y = M;
      }
    };

    // Header institucional
    doc.setFillColor(21, 36, 28);
    doc.rect(0, 0, W, 26, 'F');
    doc.setDrawColor(46, 139, 87);
    doc.setLineWidth(0.6);
    doc.line(0, 26, W, 26);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('AGROBOT · LAUDO E PRESCRIÇÃO TÉCNICA', M, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 220, 205);
    doc.text('Inteligência Agronômica Tropical', M, 18);

    const dateStr = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    doc.text(dateStr, W - M, 18, { align: 'right' });
    y = 36;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(18, 26, 21);
    doc.text(title, M, y);
    y += 2;
    doc.setDrawColor(220, 227, 216);
    doc.setLineWidth(0.3);
    doc.line(M, y + 2, W - M, y + 2);
    y += 9;

    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^#{1,3}\s/gm, '');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(40, 50, 42);

    const lines = doc.splitTextToSize(clean, CW);
    lines.forEach((line) => {
      checkPage(5.5);
      doc.text(line, M, y);
      y += 5.2;
    });

    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(110, 125, 115);
      doc.text(
        `AgroBot · Documento Técnico de Apoio · Página ${i} de ${total}`,
        W / 2,
        290,
        { align: 'center' }
      );
    }
    const fname = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 36);
    doc.save(`agrobot_laudo_${fname || 'documento'}.pdf`);
    showToast('PDF gerado e pronto para arquivamento.');
  }

  // ── Geração de Word (.doc) ──
  function generateWord(title, text) {
    const date = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const clean = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // SEC-05: Sanitiza o título da mesma forma que o body
    const safeTitle = title
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>@page{size:A4;margin:2cm 2.5cm}body{font-family:Calibri,sans-serif;font-size:11pt;color:#121a15}h1{font-family:Georgia,serif;color:#15241c;border-bottom:2px solid #2e8b57;padding-bottom:6pt}h2,h3{color:#1f5e39}li{margin-bottom:4pt}b{color:#15241c}</style></head><body><table width="100%" style="background:#15241c;padding:14pt 20pt;margin-bottom:20pt"><tr><td><span style="font-family:Arial;font-size:14pt;font-weight:bold;color:#ffffff">AGROBOT</span><br><span style="font-family:Arial;font-size:8pt;color:#d5e5db">Laudo Técnico e Prescrição Agronômica</span></td><td align="right"><span style="font-size:9pt;color:#ffffff">${date}</span></td></tr></table><h1>${safeTitle}</h1><div><p>${clean}</p></div><p style="font-size:8pt;color:#6c7d70;text-align:center;margin-top:30pt">AgroBot · Documento Técnico Normatizado</p></body></html>`;

    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const fname = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 36);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Documento Word gerado com sucesso.');
  }

  const cachedUser = getUser();
  const userName = user?.name || cachedUser?.name || 'iarley marques';
  const userPlan = user?.plan || cachedUser?.plan || 'Free';
  const uIni = userName.charAt(0).toUpperCase();
  const canSend = (inputVal.trim().length > 0 || pendingFiles.length > 0) && !isTyping;

  return (
    <div className="agro-chat-viewport">
      <div
        className={`agro-sidebar-scrim${sidebarOpen ? ' is-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ══ SIDEBAR DO WORKSPACE ══ */}
      <aside className={`agro-chat-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="agro-sidebar-head">
          <div className="agro-brand-wrapper" onClick={() => navigate('/')}>
            <div className="agro-brand-leaf">{LEAF_SVG_LIGHT}</div>
            <div className="agro-brand-text">
              <span className="agro-brand-title">AgroBot</span>
              <span className="agro-brand-sub">Painel Técnico</span>
            </div>
          </div>
          <button
            className="agro-sidebar-collapse-btn"
            onClick={() => setSidebarOpen((o) => !o)}
            title="Recolher menu lateral"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        <div className="agro-sidebar-cta">
          <button className="agro-btn-new-chat" onClick={newChat}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nova consulta técnica
          </button>
        </div>

        <div className="agro-sidebar-history">
          <div className="agro-history-heading">Histórico de conversas</div>
          {historyItems.length === 0 ? (
            <div className="agro-history-empty">
              <span>Nenhum atendimento salvo</span>
            </div>
          ) : (
            historyItems.map((item) => (
              <button
                key={item.id}
                className={`agro-history-item${item.active ? ' is-active' : ''}`}
                onClick={() => selectHistory(item)}
              >
                {DOC_ICON}
                <div className="agro-history-info">
                  <span className="agro-history-title">{item.title}</span>
                  <span className="agro-history-date">{item.date || 'Recente'}</span>
                </div>
                {item.active && (
                  <svg className="agro-history-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>

        {/* Menu do usuário logado */}
        <div className="agro-sidebar-foot">
          {userMenuOpen && (
            <div className="agro-user-popover">
              <button className="agro-pop-item" onClick={openEditModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Editar perfil técnico
              </button>
              <button
                className="agro-pop-item"
                onClick={() => {
                  setUserMenuOpen(false);
                  setSettingsOpen(true);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Configurações da IA
              </button>
              <div className="agro-pop-divider" />
              <button className="agro-pop-item is-danger" onClick={logout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Encerrar sessão
              </button>
            </div>
          )}

          <div className="agro-user-bar" onClick={() => setUserMenuOpen((o) => !o)}>
            <div className="agro-user-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="agro-user-meta">
              <span className="agro-user-name">{userName}</span>
              <span className="agro-user-role">{userPlan}</span>
            </div>
            <span className="agro-user-more">•••</span>
          </div>
        </div>
      </aside>

      {/* ══ CORPO PRINCIPAL DO CHAT ══ */}
      <main
        className="agro-chat-stage"
        onClick={() => {
          if (userMenuOpen) setUserMenuOpen(false);
          if (exportOpen) setExportOpen(false);
        }}
      >
        {/* Fundo permanente — NUNCA corta durante scroll/chat */}
        <div className="agro-chat-bg-layer" />
        {/* Barra superior de controle */}
        <header className="agro-chat-topbar">
          <div className="agro-topbar-start">
            <button
              className="agro-toggle-sidebar"
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen((o) => !o);
              }}
              title="Alternar menu lateral"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <div className="agro-topbar-session">
              <span className="agro-session-name">AgroBot · Assistente Agronômico</span>
              <span className="agro-session-pill">
                <span className="agro-session-dot" />
                Modo Campo Ativo
              </span>
            </div>
          </div>

          <div className="agro-topbar-end">
            <div className="agro-export-anchor">
              <button
                className="agro-topbar-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setExportOpen((o) => !o);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exportar registro
              </button>
              {exportOpen && (
                <div className="agro-export-menu" onClick={(e) => e.stopPropagation()}>
                  <button className="agro-pop-item" onClick={() => exportChat('txt')}>
                    Baixar relatório (.txt)
                  </button>
                  <button className="agro-pop-item" onClick={() => exportChat('md')}>
                    Baixar relatório (.md)
                  </button>
                  <button className="agro-pop-item" onClick={copyAllChat}>
                    Copiar texto integral
                  </button>
                </div>
              )}
            </div>

            <button
              className="agro-topbar-icon-btn"
              onClick={() => setSettingsOpen(true)}
              title="Configurações técnicas"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Área de mensagens */}
        <div className="agro-messages-stage" ref={chatAreaRef}>

          <div className="agro-messages-wrapper">
            {showWelcome && (
              <div className="agro-welcome-block">
                <div className="agro-welcome-emblem">
                  <div style={{ width: 32, height: 32 }}>{LEAF_SVG}</div>
                </div>
                <h1 className="agro-welcome-title">
                  Olá! Como posso ajudar na sua lavoura?
                </h1>
                <p className="agro-welcome-desc">
                  Descreva o problema, envie uma foto ou compartilhe os resultados de uma análise para receber orientações agronômicas.
                </p>

                <div className="agro-suggestions-grid">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.title}
                      className="agro-suggestion-card"
                      onClick={() => {
                        setInputVal(s.prompt);
                        setCharCount(s.prompt.length);
                        textareaRef.current?.focus();
                      }}
                    >
                      <div className="agro-card-left">
                        <div className="agro-card-icon-box">{s.icon}</div>
                        <div className="agro-card-content">
                          <span className="agro-card-title">{s.title}</span>
                          <span className="agro-card-desc">{s.desc}</span>
                        </div>
                      </div>
                      <svg className="agro-card-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div className="agro-bubbles-container">
                {messages.map((msg) => (
                  <div key={msg.id} className={`agro-bubble-row ${msg.role}`}>
                    <div className={`agro-bubble-avatar ${msg.role}`}>
                      {msg.role === 'user' ? uIni : (
                        <div style={{ width: 22, height: 22 }}>{LEAF_SVG}</div>
                      )}
                    </div>
                    <div className="agro-bubble-content">
                      <div className="agro-bubble-sender">
                        {msg.role === 'user' ? userName : 'AgroBot'}
                      </div>

                      <div
                        className="agro-bubble-text"
                        dangerouslySetInnerHTML={{ __html: msg.html }}
                      />

                      {msg.files?.length > 0 && (
                        <div className="agro-bubble-attachments">
                          {msg.files.map((f, i) =>
                            f.type?.startsWith('image/') ? (
                              <img key={i} src={f.data} className="agro-attach-img" alt={f.name} />
                            ) : (
                              <div key={i} className="agro-attach-chip">
                                <span>📄</span>
                                <span>{f.name}</span>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {msg.role === 'assistant' && !msg.streaming && (
                        <div className="agro-bubble-toolbar">
                          <button
                            className="agro-tool-btn"
                            onClick={() => copyMsg(msg.text)}
                          >
                            Copiar texto
                          </button>
                          <button
                            className="agro-tool-btn is-action"
                            onClick={() => generatePDF('Laudo Técnico AgroBot', msg.text)}
                          >
                            Gerar Laudo PDF
                          </button>
                          <button
                            className="agro-tool-btn is-action"
                            onClick={() => generateWord('Laudo Técnico AgroBot', msg.text)}
                          >
                            Baixar Word (.doc)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="agro-bubble-row assistant">
                    <div className="agro-bubble-avatar assistant">
                      <div style={{ width: 22, height: 22 }}>{LEAF_SVG}</div>
                    </div>
                    <div className="agro-bubble-content">
                      <div className="agro-bubble-sender">AgroBot</div>
                      <div className="agro-typing-indicator">
                        <span className="dot" />
                        <span className="dot" />
                        <span className="dot" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pré-visualização de anexos pendentes */}
        {pendingFiles.length > 0 && (
          <div className="agro-pending-bar">
            {pendingFiles.map((f, i) => (
              <div key={i} className="agro-pending-chip">
                {f.type?.startsWith('image/') && (
                  <img src={f.data} className="thumb" alt="" />
                )}
                <span className="name">{f.name}</span>
                <button
                  className="remove"
                  onClick={() =>
                    setPendingFiles((prev) => prev.filter((_, j) => j !== i))
                  }
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Caixa de Entrada de Texto */}
        <div className="agro-composer-dock">
          <div className="agro-composer-box">
            <button
              className={`agro-btn-attach${pendingFiles.length > 0 ? ' has-files' : ''}`}
              title="Anexar foto do campo ou laudo laboratorial"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              multiple
              accept="image/*,.pdf,.txt,.csv,.xlsx,.doc,.docx"
              onChange={handleFiles}
            />

            <textarea
              ref={textareaRef}
              className="agro-composer-input"
              placeholder="Descreva sua dúvida agronômica..."
              rows={1}
              value={inputVal}
              onKeyDown={handleKey}
              onChange={handleInput}
            />

            <button
              className="agro-btn-send"
              onClick={sendMessage}
              disabled={!canSend}
              title="Enviar consulta técnica"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22 11 13 2 9l20-7z" />
              </svg>
            </button>
          </div>

          <div className="agro-composer-hint">
            <span className="agro-key-pill">Enter</span> para enviar · <span className="agro-key-pill">Shift + Enter</span> para quebrar linha
          </div>
        </div>
      </main>

      {/* ══ MODAL DE EDIÇÃO DE PERFIL (SEU PERFIL PROFISSIONAL) ══ */}
      {editModalOpen && (
        <div
          className="agro-modal-backdrop is-visible"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="agro-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="agro-modal-header">
              <div className="agro-modal-badge">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </div>
              <div className="agro-modal-titles">
                <h2 className="agro-modal-title">Seu perfil profissional</h2>
                <p className="agro-modal-sub">
                  Esses dados ajudam a identificar você nos registros e laudos.
                </p>
              </div>
            </div>

            <div className="agro-modal-form">
              <div className="agro-field">
                <label className="agro-label">Nome completo</label>
                <input
                  className="agro-input agro-modal-input"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Seu nome completo"
                  maxLength={50}
                />
              </div>

              <div className="agro-field">
                <label className="agro-label">Atuação ou qualificação</label>
                <div className="agro-select-wrapper">
                  <select
                    className="agro-input agro-modal-select"
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                  >
                    <option value="Estudante de Informática">Estudante de Informática</option>
                    <option value="Engenheiro Agrônomo">Engenheiro Agrônomo</option>
                    <option value="Técnico Agrícola">Técnico Agrícola</option>
                    <option value="Estudante de Agronomia">Estudante de Agronomia</option>
                    <option value="Produtor Rural">Produtor Rural</option>
                    <option value="Consultor Agrícola">Consultor Agrícola</option>
                    <option value="Pesquisador">Pesquisador</option>
                    <option value="Outro">Outro</option>
                  </select>
                  <svg className="agro-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              <div className="agro-field">
                <label className="agro-label">
                  Registro profissional <span className="agro-label-opt">(opcional)</span>
                </label>
                <input
                  className="agro-input agro-modal-input"
                  type="text"
                  value={editReg}
                  onChange={(e) => setEditReg(e.target.value)}
                  placeholder="CREA, conselho ou registro, se aplicável"
                />
              </div>

              <div className="agro-modal-actions-between">
                <button
                  type="button"
                  className="agro-modal-btn-cancel"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="agro-modal-btn-save"
                  onClick={updateUser}
                >
                  Salvar perfil
                </button>
              </div>

              <div className="agro-modal-footer-note">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Você poderá atualizar essas informações depois.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ PAINEL DE CONFIGURAÇÕES (CONFIGURAÇÕES DO ASSISTENTE) ══ */}
      {settingsOpen && (
        <div
          className="agro-modal-backdrop is-visible"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="agro-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative' }}
          >
            <button
              type="button"
              className="agro-dialog-close"
              onClick={() => setSettingsOpen(false)}
              aria-label="Fechar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="agro-modal-header">
              <div className="agro-modal-badge">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
              </div>
              <div className="agro-modal-titles">
                <h2 className="agro-modal-title">Configurações do assistente</h2>
                <p className="agro-modal-sub">
                  Personalize o idioma e o nível de detalhe das respostas.
                </p>
              </div>
            </div>

            <div className="agro-modal-form">
              <div className="agro-field">
                <label className="agro-label">Extensão das respostas</label>
                <div className="agro-segmented-tabs">
                  <button
                    type="button"
                    className={`agro-seg-btn${(settings.length === 'concise' || settings.tokens === 600) ? ' is-active' : ''}`}
                    onClick={() => setSettings((s) => ({ ...s, length: 'concise', tokens: 600 }))}
                  >
                    <span>— Concisa</span>
                  </button>
                  <button
                    type="button"
                    className={`agro-seg-btn${(!settings.length || settings.length === 'balanced' || settings.tokens === 1200) ? ' is-active' : ''}`}
                    onClick={() => setSettings((s) => ({ ...s, length: 'balanced', tokens: 1200 }))}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Equilibrada</span>
                  </button>
                  <button
                    type="button"
                    className={`agro-seg-btn${(settings.length === 'detailed' || settings.tokens === 2000) ? ' is-active' : ''}`}
                    onClick={() => setSettings((s) => ({ ...s, length: 'detailed', tokens: 2000 }))}
                  >
                    <span>+ Detalhada</span>
                  </button>
                </div>
                <span className="agro-field-hint">
                  Ajusta o nível de explicação das orientações agronômicas.
                </span>
              </div>

              <div className="agro-field">
                <label className="agro-label">Idioma das respostas</label>
                <div className="agro-input-with-icon">
                  <svg className="agro-input-prefix-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <select
                    className="agro-input agro-modal-select has-prefix"
                    value={settings.lang}
                    onChange={(e) => setSettings((s) => ({ ...s, lang: e.target.value }))}
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en">Inglês (English)</option>
                    <option value="es">Espanhol (Español)</option>
                  </select>
                  <svg className="agro-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              <div className="agro-modal-mint-card">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, color: '#165337' }}>
                  <circle cx="12" cy="12" r="10" fill="#165337" />
                  <line x1="12" y1="16" x2="12" y2="12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="8" r="1.2" fill="#ffffff" />
                </svg>
                <span>As preferências serão usadas nas próximas consultas.</span>
              </div>

              <div className="agro-modal-actions-end">
                <button
                  type="button"
                  className="agro-modal-btn-cancel"
                  onClick={() => setSettingsOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="agro-modal-btn-save"
                  onClick={saveSettings}
                >
                  Salvar preferências
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ NOTIFICAÇÃO TOAST ══ */}
      <div className={`agro-toast${toastVisible ? ' is-visible' : ''}`}>{toast}</div>
    </div>
  );
}
