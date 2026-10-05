import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const PLANT_SVG = (
  <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18 }}>
    <path d="M12 22V11" stroke="#1F5E39" strokeWidth="2.2" strokeLinecap="round" />
    <path
      d="M12 11C12 11 7.5 9.8 5.5 5.5C5.5 5.5 10 3.8 13.5 7.5C13.5 7.5 15.2 9.2 12 11Z"
      fill="#2E8B57"
      fillOpacity="0.85"
      stroke="#1F5E39"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M12 15.5C12 15.5 16 13.8 17.8 9.5C17.8 9.5 13.5 8.5 10.5 13C10.5 13 9.8 14.5 12 15.5Z"
      fill="#4CAF50"
      fillOpacity="0.75"
      stroke="#1F5E39"
      strokeWidth="1.8"
      strokeLinejoin="round"
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
  const [historyItems, setHistoryItems] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeServerId, setActiveServerId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPlan, setEditPlan] = useState('');
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
    files.forEach((file) => {
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
          { id: `server_${serverId}`, title: snippet, serverId, active: true },
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
    setEditName(user?.name || '');
    setEditPlan(user?.plan || 'Agronomia IA');
    setUserMenuOpen(false);
    setEditModalOpen(true);
  }

  async function updateUser() {
    try {
      const r = await fetch(`${API}/api/me`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({ name: editName, plan: editPlan }),
      });
      if (r.ok) {
        const d = await r.json();
        setUser(d.user);
        sessionStorage.setItem('agro_user', JSON.stringify(d.user));
        showToast('Perfil atualizado com sucesso.');
      }
    } catch {}
    setEditModalOpen(false);
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

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>@page{size:A4;margin:2cm 2.5cm}body{font-family:Calibri,sans-serif;font-size:11pt;color:#121a15}h1{font-family:Georgia,serif;color:#15241c;border-bottom:2px solid #2e8b57;padding-bottom:6pt}h2,h3{color:#1f5e39}li{margin-bottom:4pt}b{color:#15241c}</style></head><body><table width="100%" style="background:#15241c;padding:14pt 20pt;margin-bottom:20pt"><tr><td><span style="font-family:Arial;font-size:14pt;font-weight:bold;color:#ffffff">AGROBOT</span><br><span style="font-family:Arial;font-size:8pt;color:#d5e5db">Laudo Técnico e Prescrição Agronômica</span></td><td align="right"><span style="font-size:9pt;color:#ffffff">${date}</span></td></tr></table><h1>${title}</h1><div><p>${clean}</p></div><p style="font-size:8pt;color:#6c7d70;text-align:center;margin-top:30pt">AgroBot · Documento Técnico Normatizado</p></body></html>`;

    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const fname = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 36);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `agrobot_laudo_${fname || 'documento'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Documento Word gerado com sucesso.');
  }

  const uIni = user ? (user.name || '?').charAt(0).toUpperCase() : '?';
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
          <a className="agro-brand" href="/">
            <div className="agro-brand-mark">{PLANT_SVG}</div>
            <div className="agro-brand-text">
              <span className="agro-brand-name">AgroBot</span>
              <span className="agro-brand-sub">Painel Técnico</span>
            </div>
          </a>
          <button
            className="agro-icon-btn agro-btn-new-head"
            onClick={newChat}
            title="Nova consulta"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        <div className="agro-sidebar-cta">
          <button className="agro-btn agro-btn-primary agro-btn-block" onClick={newChat}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nova consulta técnica
          </button>
        </div>

        <div className="agro-sidebar-history">
          <div className="agro-history-heading">Histórico de consultas</div>
          {historyItems.length === 0 ? (
            <div className="agro-history-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Nenhum atendimento salvo</span>
            </div>
          ) : (
            historyItems.map((item) => (
              <button
                key={item.id}
                className={`agro-history-row${item.active ? ' is-active' : ''}`}
                onClick={() => selectHistory(item)}
              >
                <span className="agro-history-title">{item.title}</span>
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
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
            <div className="agro-user-badge">{uIni}</div>
            <div className="agro-user-meta">
              <span className="agro-user-name">{user?.name || 'Profissional'}</span>
              <span className="agro-user-role">{user?.plan || 'Agronomia IA'}</span>
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
        {/* Barra superior de controle */}
        <header className="agro-chat-topbar">
          <div className="agro-topbar-start">
            <button
              className="agro-icon-btn agro-toggle-sidebar"
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen((o) => !o);
              }}
              title="Alternar menu lateral"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <div className="agro-topbar-session">
              <span className="agro-session-name">AgroBot · Assistente Agronômico</span>
              <span className="agro-session-tag">Modo Campo Ativo</span>
            </div>
          </div>

          <div className="agro-topbar-end">
            <div className="agro-export-anchor">
              <button
                className="agro-btn agro-btn-outline agro-btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setExportOpen((o) => !o);
                }}
              >
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
              className="agro-icon-btn"
              onClick={() => setSettingsOpen(true)}
              title="Configurações técnicas"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Área de mensagens */}
        <div className="agro-messages-stage" ref={chatAreaRef}>
          <div className="agro-messages-wrapper">
            {showWelcome && (
              <div className="agro-welcome-block">
                <div className="agro-welcome-emblem">{PLANT_SVG}</div>
                <h1 className="agro-welcome-title">
                  Olá, {user?.name ? user.name.split(' ')[0] : 'colega agrônomo'}.
                </h1>
                <p className="agro-welcome-desc">
                  Qual demanda de campo vamos analisar hoje? Você pode detalhar uma ocorrência no talhão, enviar laudos químicos de solo ou anexar fotos para inspeção fitossanitária.
                </p>

                <div className="agro-prompt-suggestions">
                  {[
                    {
                      label: 'Análise de solo',
                      text: 'Interpretar laudo de solo: pH em CaCl2 de 5.1, V% de 44% e CTC de 10.4 cmolc/dm³. Qual a necessidade de calagem para soja?',
                    },
                    {
                      label: 'Fitossanidade',
                      text: 'Identifiquei sintomas de manchas circulares com halo amarelado em milho safrinha no estádio V8. Quais as hipóteses?',
                    },
                    {
                      label: 'Manejo hídrico',
                      text: 'Qual a recomendação de turno de rega e lâmina líquida para pivô central em fase reprodutiva de feijão?',
                    },
                    {
                      label: 'Adubação de cobertura',
                      text: 'Cálculo de adubação de cobertura nitrogenada e potássica no milho para meta de produtividade de 140 sc/ha.',
                    },
                  ].map((s) => (
                    <button
                      key={s.label}
                      className="agro-prompt-card"
                      onClick={() => {
                        setInputVal(s.text);
                        setCharCount(s.text.length);
                        textareaRef.current?.focus();
                      }}
                    >
                      <span className="agro-prompt-label">{s.label}</span>
                      <span className="agro-prompt-text">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`agro-bubble-row ${msg.role}`}>
                <div className={`agro-bubble-avatar ${msg.role}`}>
                  {msg.role === 'user' ? uIni : PLANT_SVG}
                </div>
                <div className="agro-bubble-content">
                  <div className="agro-bubble-sender">
                    {msg.role === 'user' ? (user?.name || 'Você') : 'AgroBot'}
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

                  {msg.role === 'assistant' && (
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
                <div className="agro-bubble-avatar assistant">{PLANT_SVG}</div>
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
            <textarea
              ref={textareaRef}
              className="agro-composer-input"
              placeholder="Descreva a ocorrência no talhão ou cole parâmetros de análise..."
              rows={1}
              value={inputVal}
              onKeyDown={handleKey}
              onChange={handleInput}
            />

            <div className="agro-composer-actions">
              <button
                className={`agro-icon-btn agro-btn-attach${pendingFiles.length > 0 ? ' has-files' : ''}`}
                title="Anexar foto do campo ou laudo laboratorial"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
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

              <button
                className="agro-btn agro-btn-primary agro-btn-send"
                onClick={sendMessage}
                disabled={!canSend}
                title="Enviar consulta técnica"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22 11 13 2 9l20-7z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="agro-composer-hint">
            <span>Pressione <kbd>Enter</kbd> para enviar · <kbd>Shift + Enter</kbd> para quebra de linha</span>
            {charCount > 0 && <span>{charCount} caracteres</span>}
          </div>
        </div>
      </main>

      {/* ══ MODAL DE EDIÇÃO DE PERFIL ══ */}
      {editModalOpen && (
        <div className="agro-modal-backdrop is-visible">
          <div className="agro-auth-dialog">
            <h2 className="agro-dialog-title">Atualizar cadastro profissional</h2>
            <p className="agro-dialog-sub">Mantenha seus dados atualizados para a emissão dos laudos.</p>

            <div className="agro-form-stack" style={{ marginTop: 16 }}>
              <div className="agro-field">
                <label className="agro-label">Nome completo</label>
                <input
                  className="agro-input"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={40}
                />
              </div>

              <div className="agro-field">
                <label className="agro-label">Atuação ou qualificação</label>
                <input
                  className="agro-input"
                  type="text"
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  placeholder="Ex: Engenheiro Agrônomo · CREA-SP"
                />
              </div>

              <div className="agro-dialog-actions" style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  className="agro-btn agro-btn-outline"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancelar
                </button>
                <button className="agro-btn agro-btn-primary" onClick={updateUser}>
                  Salvar dados
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ PAINEL DE CONFIGURAÇÕES ══ */}
      {settingsOpen && (
        <div className="agro-modal-backdrop is-visible">
          <div className="agro-auth-dialog">
            <div className="agro-dialog-header">
              <h2 className="agro-dialog-title">Configurações do Assistente</h2>
              <p className="agro-dialog-sub">Ajuste o comportamento do modelo e a extensão das respostas.</p>
            </div>

            <div className="agro-form-stack" style={{ marginTop: 16 }}>
              <div className="agro-field">
                <label className="agro-label">Extensão máxima de resposta (tokens)</label>
                <input
                  type="number"
                  className="agro-input"
                  value={settings.tokens}
                  min={300}
                  max={4000}
                  step={100}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      tokens: parseInt(e.target.value) || 1200,
                    }))
                  }
                />
              </div>

              <div className="agro-field">
                <label className="agro-label">Idioma técnico preferencial</label>
                <select
                  className="agro-input"
                  value={settings.lang}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, lang: e.target.value }))
                  }
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en">Inglês (English)</option>
                  <option value="es">Espanhol (Español)</option>
                </select>
              </div>

              <div className="agro-dialog-actions" style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  className="agro-btn agro-btn-outline"
                  onClick={() => setSettingsOpen(false)}
                >
                  Fechar
                </button>
                <button className="agro-btn agro-btn-primary" onClick={saveSettings}>
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
