import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const PLANT_SVG = (
  <svg viewBox="0 0 24 24" fill="none" style={{width:16,height:16}}>
    <path d="M12 22V12" stroke="#A3E635" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 12C12 12 7 11 5 6C5 6 10 4 14 8C14 8 16 10 12 12Z" fill="#A3E635" fillOpacity="0.4" stroke="#A3E635" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M12 17C12 17 16 15 18 10C18 10 13 9 10 14C10 14 9 16 12 17Z" fill="#4ADE80" fillOpacity="0.35" stroke="#4ADE80" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

// ── Auth helpers ──
function getToken()  { return sessionStorage.getItem('agro_token'); }
function getUser()   { try { return JSON.parse(sessionStorage.getItem('agro_user')); } catch { return null; } }
function authHeader(){ return { 'Authorization': 'Bearer ' + getToken(), 'Content-Type': 'application/json' }; }

// ── API URL (proxied via Vite in dev, same origin in prod) ──
const API = import.meta.env.VITE_API_URL || '';

// ── markdown formatter ──
function fmtMd(t) {
  return t
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/^### (.+)$/gm,'<h3 style="color:var(--green);font-family:var(--mono);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:14px 0 6px">$1</h3>')
    .replace(/^## (.+)$/gm,'<h3 style="color:var(--green);font-family:var(--mono);font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:14px 0 6px">$1</h3>')
    .replace(/^- (.+)$/gm,'<li style="margin-left:16px;margin-bottom:4px">$1</li>')
    .replace(/^\d+\. (.+)$/gm,'<li style="margin-left:16px;margin-bottom:4px">$1</li>')
    .replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>')
    .replace(/^/,'<p>').replace(/$/,'</p>');
}

function buildSystemPrompt(lang = 'pt-BR') {
  const langMap = {'pt-BR':'português brasileiro','en':'English','es':'español'};
  const l = langMap[lang] || 'português brasileiro';
  return `Você é o AgroBot, um assistente especialista em agronomia e agricultura tropical brasileira. Você tem vasto conhecimento em:
- Solos: análise, correção de pH, adubação, calagem, manejo de fertilidade
- Culturas: soja, milho, café, cana, tomate, feijão, hortaliças, fruticultura e outras
- Pragas e doenças: diagnóstico, manejo integrado (MIP), defensivos
- Irrigação: gotejamento, aspersão, pivô central, manejo hídrico
- Sustentabilidade: plantio direto, rotação de culturas, agroecologia
- Colheita, pós-colheita e armazenamento
- Clima e zoneamento agrícola do Brasil

Quando o usuário enviar uma imagem, analise-a detalhadamente: identifique plantas, pragas, doenças, deficiências nutricionais, solo ou qualquer elemento agrícola visível.

GERAÇÃO DE DOCUMENTOS: Quando o usuário pedir para gerar um relatório, laudo, receituário agronômico, ficha técnica, plano de manejo ou qualquer documento técnico, você deve SEMPRE redigir o documento completo e formatado no chat. Estruture o documento com seções claras usando títulos (## SEÇÃO) e campos em **negrito**.

Responda sempre em ${l}. Use **negrito** para termos técnicos importantes. Seja direto, técnico e completo.`;
}

function getSavedSettings() {
  return Object.assign({ tokens:1000, lang:'pt-BR', compact:false, anim:true },
    JSON.parse(sessionStorage.getItem('agro_settings') || '{}'));
}

export default function Chat() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);          // {id, role, html, text, files}
  const [conversationHistory, setConversationHistory] = useState([]); // for API
  const [inputVal, setInputVal] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [historyItems, setHistoryItems] = useState([]);  // {id, title, serverId}
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

  // ── Load user on mount ──
  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/'); return; }
    fetch(`${API}/api/me`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        sessionStorage.setItem('agro_user', JSON.stringify(data.user));
        setUser(data.user);
        return loadServerConversations();
      })
      .catch(() => {
        const cached = getUser();
        if (cached) setUser(cached);
        else navigate('/');
      });
  }, []);

  function scrollBot() {
    if (chatAreaRef.current) chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
  }
  useEffect(() => { scrollBot(); }, [messages, isTyping]);

  // ── Server conversations ──
  async function loadServerConversations() {
    try {
      const r = await fetch(`${API}/api/conversations`, { headers: authHeader() });
      if (!r.ok) return;
      const data = await r.json();
      const convs = data.conversations || [];
      setHistoryItems(prev => {
        const ids = new Set(prev.map(x => x.serverId));
        const newItems = convs.filter(c => !ids.has(c.id)).map(c => ({ id: `server_${c.id}`, title: c.title || 'Nova conversa', serverId: c.id }));
        return [...newItems, ...prev];
      });
    } catch {}
  }

  async function createServerConversation(title) {
    try {
      const r = await fetch(`${API}/api/conversations`, {
        method: 'POST', headers: authHeader(), body: JSON.stringify({ title: title || 'Nova conversa' })
      });
      if (!r.ok) return null;
      const data = await r.json();
      return data.conversation?.id || null;
    } catch { return null; }
  }

  async function saveServerMessage(convId, role, content) {
    if (!convId || !content || (typeof content === 'string' && !content.trim())) return;
    try {
      await fetch(`${API}/api/conversations/${convId}/messages`, {
        method: 'POST', headers: authHeader(), body: JSON.stringify({ role, content })
      });
    } catch {}
  }

  async function loadServerConversation(serverId) {
    try {
      const r = await fetch(`${API}/api/conversations/${serverId}/messages`, { headers: authHeader() });
      if (!r.ok) return;
      const data = await r.json();
      if (!Array.isArray(data.messages)) return;
      setShowWelcome(false);
      const newHistory = [];
      const newMessages = data.messages.map((msg, i) => {
        newHistory.push({ role: msg.role, content: msg.content || '' });
        return {
          id: i,
          role: msg.role,
          html: msg.role === 'assistant' ? fmtMd(msg.content || '') : `<p>${esc(msg.content || '')}</p>`,
          text: msg.content || '',
          files: []
        };
      });
      setMessages(newMessages);
      setConversationHistory(newHistory);
    } catch {}
  }

  function esc(t) { return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // ── New chat ──
  function newChat() {
    if (activeConvId) {
      convSnapshotsRef.current[activeConvId] = { messages, history: conversationHistory };
    }
    setMessages([]); setConversationHistory([]); setShowWelcome(true);
    setActiveConvId(null); setActiveServerId(null); setInputVal('');
    setPendingFiles([]); setHistoryItems(prev => prev.map(h => ({ ...h, active: false })));
    if (window.innerWidth <= 768) setSidebarOpen(false);
  }

  // ── Select history item ──
  async function selectHistory(item) {
    if (activeConvId) {
      convSnapshotsRef.current[activeConvId] = { messages, history: conversationHistory };
    }
    setHistoryItems(prev => prev.map(h => ({ ...h, active: h.id === item.id })));
    setActiveConvId(item.id);
    setActiveServerId(item.serverId || null);
    if (item.serverId) {
      await loadServerConversation(item.serverId);
    } else {
      const snap = convSnapshotsRef.current[item.id];
      if (snap) { setMessages(snap.messages); setConversationHistory(snap.history); setShowWelcome(false); }
    }
    if (window.innerWidth <= 768) setSidebarOpen(false);
  }

  // ── Send message ──
  async function sendMessage() {
    const text = inputVal.trim();
    if ((!text && !pendingFiles.length) || isTyping) return;

    let currentServerId = activeServerId;
    let currentConvId = activeConvId;

    if (!currentConvId) {
      setShowWelcome(false);
      const title = text || pendingFiles[0]?.name || 'Nova conversa';
      const serverId = await createServerConversation(title);
      const newId = serverId ? `server_${serverId}` : `local_${Date.now()}`;
      currentConvId = newId;
      currentServerId = serverId;
      setActiveConvId(newId);
      setActiveServerId(serverId);
      setHistoryItems(prev => [
        { id: newId, title, serverId, active: true },
        ...prev.map(h => ({ ...h, active: false }))
      ]);
    }

    const files = [...pendingFiles];
    setPendingFiles([]);
    const imgFiles = files.filter(f => f.type?.startsWith('image/'));
    const otherFiles = files.filter(f => !f.type?.startsWith('image/'));
    let apiText = text;
    otherFiles.forEach(f => { apiText += `\n[Arquivo: ${f.name}]\n${String(f.data).slice(0,2000)}`; });

    const userMsgId = Date.now();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', html: text ? `<p>${esc(text)}</p>` : '', text, files }]);
    setInputVal(''); setCharCount(0);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    if (currentServerId) saveServerMessage(currentServerId, 'user', apiText);

    // Build user content for API
    let userContent;
    if (imgFiles.length > 0) {
      userContent = [];
      imgFiles.forEach(f => {
        const mime = f.type || 'image/jpeg';
        const b64 = f.data.includes(',') ? f.data.split(',')[1] : f.data;
        userContent.push({ type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } });
      });
      if (apiText) userContent.push({ type: 'text', text: apiText });
    } else {
      userContent = apiText;
    }

    const newHistory = [...conversationHistory, { role: 'user', content: userContent }];
    setConversationHistory(newHistory);
    setIsTyping(true);

    const s = getSavedSettings();
    try {
      const resp = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
        body: JSON.stringify({ max_tokens: s.tokens, system: buildSystemPrompt(s.lang), messages: newHistory, stream: true })
      });
      if (resp.status === 401) { sessionStorage.clear(); navigate('/'); return; }
      if (!resp.ok) throw new Error('API error');
      setIsTyping(false);

      const botId = Date.now() + 1;
      setMessages(prev => [...prev, { id: botId, role: 'assistant', html: '', text: '', files: [], streaming: true }]);

      let full = '';
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const d = line.slice(6).trim();
          if (d === '[DONE]') continue;
          try {
            const p = JSON.parse(d);
            if (p.type === 'content_block_delta' && p.delta?.type === 'text_delta') {
              full += p.delta.text;
              setMessages(prev => prev.map(m => m.id === botId ? { ...m, html: fmtMd(full), text: full } : m));
            }
          } catch {}
        }
      }
      setMessages(prev => prev.map(m => m.id === botId ? { ...m, streaming: false } : m));
      const updatedHistory = [...newHistory, { role: 'assistant', content: full }];
      setConversationHistory(updatedHistory);
      if (currentServerId) saveServerMessage(currentServerId, 'assistant', full);
      if (currentConvId) convSnapshotsRef.current[currentConvId] = { messages: undefined, history: updatedHistory };
    } catch {
      setIsTyping(false);
      const errId = Date.now() + 2;
      setMessages(prev => [...prev, { id: errId, role: 'assistant', html: '<p>⚠️ Erro ao conectar com a IA. Verifique sua conexão.</p>', text: '', files: [] }]);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }
  function handleInput(e) {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
    setInputVal(el.value);
    setCharCount(el.value.length);
  }

  function handleFiles(e) {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setPendingFiles(prev => [...prev, { name: file.name, type: file.type, data: ev.target.result }]);
      };
      if (file.type.startsWith('image/')) reader.readAsDataURL(file);
      else reader.readAsText(file);
    });
    e.target.value = '';
  }

  // ── Settings ──
  function saveSettings() {
    sessionStorage.setItem('agro_settings', JSON.stringify(settings));
    setSettingsOpen(false);
  }

  // ── Edit profile ──
  function openEditModal() {
    setUserMenuOpen(false);
    setEditName(user?.name || '');
    setEditPlan(user?.plan || '');
    setEditModalOpen(true);
  }
  function updateUser() {
    if (!editName.trim()) return;
    const u = { ...user, name: editName.trim(), plan: editPlan.trim() };
    sessionStorage.setItem('agro_user', JSON.stringify(u));
    setUser(u);
    setEditModalOpen(false);
  }

  // ── Logout ──
  function logout() {
    fetch(`${API}/api/logout`, { method: 'POST', headers: authHeader() }).finally(() => {
      sessionStorage.clear(); navigate('/');
    });
  }

  // ── Toast ──
  function showToast(msg) {
    setToast(msg); setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }

  // ── Copy message ──
  function copyMsg(text) {
    navigator.clipboard.writeText(text).then(() => showToast('✅ Copiado!'));
  }

  // ── Export ──
  function exportChat(fmt) {
    setExportOpen(false);
    if (!messages.length) return;
    let out = fmt === 'md' ? '# Conversa AgroBot\n\n' : 'Conversa AgroBot\n\n';
    messages.forEach(m => {
      const name = m.role === 'user' ? (user?.name || 'Você') : 'AgroBot';
      out += fmt === 'md' ? `**${name}**\n${m.text}\n\n---\n\n` : `${name}\n${m.text}\n\n`;
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([out], { type: 'text/plain' }));
    a.download = `agrobot.${fmt}`; a.click();
  }
  function copyAllChat() {
    setExportOpen(false);
    let out = '';
    messages.forEach(m => {
      const name = m.role === 'user' ? (user?.name || 'Você') : 'AgroBot';
      out += `${name}\n${m.text}\n\n`;
    });
    navigator.clipboard.writeText(out).then(() => showToast('✅ Conversa copiada!'));
  }

  // ── PDF generation ──
  async function generatePDF(title, text) {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, M = 18, CW = W - M * 2;
    let y = 0;
    const checkPage = needed => { if (y + needed > 280) { doc.addPage(); y = M; } };
    doc.setFillColor(11,14,10); doc.rect(0,0,W,28,'F');
    doc.setDrawColor(163,230,53); doc.setLineWidth(0.5); doc.line(0,28,W,28);
    doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.setTextColor(163,230,53);
    doc.text('AGROBOT', M, 12);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(127,191,144);
    doc.text('Assistente de Agronomia com IA', M, 19);
    const dateStr = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
    doc.text(dateStr, W-M, 19, {align:'right'}); y = 38;
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(240,245,236);
    doc.text(title, M, y); y += 2;
    doc.setDrawColor(163,230,53); doc.setLineWidth(0.3); doc.line(M, y+3, W-M, y+3); y += 10;
    const clean = text.replace(/\*\*(.*?)\*\*/g,'$1').replace(/\*(.*?)\*/g,'$1').replace(/^#{1,3}\s/gm,'');
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(74,222,128); doc.text('AGROBOT', M, y); y += 6;
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(210,225,200);
    const lines = doc.splitTextToSize(clean, CW);
    lines.forEach(line => { checkPage(6); doc.text(line, M, y); y += 5.5; });
    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i); doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(80,110,70);
      doc.text(`AgroBot IA  ·  Gerado automaticamente  ·  Página ${i} de ${total}`, W/2, 291, {align:'center'});
    }
    const fname = title.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'').slice(0,40);
    doc.save(`agrobot_${fname}.pdf`);
    showToast('✅ PDF gerado com sucesso!');
  }

  function generateWord(title, text) {
    const date = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
    const clean = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.*?)\*\*/g,'<b>$1</b>').replace(/\*(.*?)\*/g,'<i>$1</i>')
      .replace(/^## (.+)$/gm,'<h2>$1</h2>').replace(/^- (.+)$/gm,'<li>$1</li>')
      .replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>');
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><meta name="ProgId" content="Word.Document"><style>@page{size:A4;margin:2cm 2.5cm}body{font-family:Calibri,sans-serif;font-size:11pt;color:#1a2b12}h1{font-family:Georgia,serif;color:#2d5a1b;border-bottom:2px solid #a3e635;padding-bottom:6pt}h2,h3{color:#3a7a24}li{margin-bottom:4pt}b{color:#2d5a1b}</style></head><body><table width="100%" style="background:#0b0e0a;padding:14pt 20pt;margin-bottom:20pt"><tr><td><span style="font-family:Courier New;font-size:16pt;font-weight:bold;color:#a3e635;letter-spacing:3pt">AGROBOT</span><br><span style="font-family:Courier New;font-size:8pt;color:#7fbf90">Assistente de Agronomia com IA</span></td><td align="right"><span style="font-size:9pt;color:#7fbf90">${date}</span></td></tr></table><h1>${title}</h1><div style="font-family:Calibri;font-size:11pt;color:#1a2b12;line-height:1.6"><p>${clean}</p></div><p style="font-size:7pt;color:#7fbf90;text-align:center;margin-top:30pt">AgroBot IA &nbsp;&middot;&nbsp; Gerado automaticamente</p></body></html>`;
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const fname = title.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'').slice(0,40);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `agrobot_${fname}.doc`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('✅ Documento Word gerado!');
  }

  const uIni = user ? (user.name || '?').charAt(0).toUpperCase() : '?';
  const canSend = (inputVal.trim().length > 0 || pendingFiles.length > 0) && !isTyping;

  return (
    <div className="chat-page">
      {/* ── Sidebar overlay ── */}
      <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ══ SIDEBAR ══ */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <a className="sidebar-logo" href="/">
            <div className="chat-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" style={{width:18,height:18}}>
                <path d="M12 22V12" stroke="#A3E635" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 12C12 12 7 11 5 6C5 6 10 4 14 8C14 8 16 10 12 12Z" fill="#A3E635" fillOpacity=".4" stroke="#A3E635" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M12 17C12 17 16 15 18 10C18 10 13 9 10 14C10 14 9 16 12 17Z" fill="#4ADE80" fillOpacity=".35" stroke="#4ADE80" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="chat-logo-name"><em>AGRO</em><span>BOT</span></span>
          </a>
          <button className="btn-new" onClick={newChat} title="Nova conversa">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>

        <button className="new-chat-btn" onClick={newChat}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Nova conversa
        </button>

        <div className="history-list">
          {historyItems.length === 0
            ? <div className="history-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>Nenhuma conversa ainda</span>
              </div>
            : historyItems.map(item => (
                <div key={item.id} className={`history-item${item.active ? ' active' : ''}`} onClick={() => selectHistory(item)}>
                  <div className="history-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <span className="history-item-text">{item.title?.slice(0,34)}{(item.title?.length||0) > 34 ? '…' : ''}</span>
                </div>
              ))
          }
        </div>

        {/* User menu popup */}
        <div className={`user-menu-popup${userMenuOpen ? ' open' : ''}`}>
          <div className="menu-item" onClick={openEditModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar perfil
          </div>
          <div className="menu-item" onClick={() => { setUserMenuOpen(false); setSettingsOpen(true); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Configurações
          </div>
          <div className="menu-item" onClick={() => { setUserMenuOpen(false); newChat(); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Nova conversa
          </div>
          <div className="menu-sep"/>
          <div className="menu-item danger" onClick={logout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Trocar conta
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-info" onClick={() => setUserMenuOpen(o => !o)}>
            <div className="user-avatar">{uIni}</div>
            <div className="user-details">
              <div className="user-name-el">{(user?.name || '').toUpperCase()}</div>
              <div className="user-plan-el">{(user?.plan || 'AGRONOMIA IA').toUpperCase()}</div>
            </div>
            <button className="user-menu-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="chat-main" onClick={() => { if(userMenuOpen) setUserMenuOpen(false); if(exportOpen) setExportOpen(false); }}>
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <button className="sidebar-toggle" onClick={e => { e.stopPropagation(); setSidebarOpen(o => !o); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>
            <span className="topbar-title">AGROBOT</span>
            <span className="topbar-badge">IA AGRÍCOLA</span>
          </div>
          <div className="topbar-right">
            <div className="topbar-btn-wrap">
              <button className="topbar-btn" title="Compartilhar conversa" onClick={e => { e.stopPropagation(); setExportOpen(o => !o); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              </button>
              <div className={`export-panel${exportOpen ? ' open' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="menu-item" onClick={() => exportChat('txt')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Exportar .txt</div>
                <div className="menu-item" onClick={() => exportChat('md')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Exportar .md</div>
                <div className="menu-sep"/>
                <div className="menu-item" onClick={copyAllChat}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copiar conversa</div>
              </div>
            </div>
            <button className="topbar-btn" title="Download da conversa" onClick={() => exportChat('txt')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button className="topbar-btn" title="Configurações" onClick={() => setSettingsOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div className="chat-area" ref={chatAreaRef}>
          <div className="messages-wrap">
            {showWelcome && (
              <div className="welcome">
                <div className="welcome-icon">{PLANT_SVG}</div>
                <h1>Por onde começamos, <span className="hl">{user?.name || ''}!</span></h1>
                <p>Sou o AgroBot, seu assistente de agronomia com IA. Descreva seu problema de campo e receba diagnóstico técnico imediato.</p>
                <div className="suggestions">
                  {[
                    {label:'Solo', text:'Minha lavoura tem pH ácido, como corrigir?'},
                    {label:'Pragas', text:'Estou vendo manchas nas folhas da soja, o que pode ser?'},
                    {label:'Irrigação', text:'Qual a frequência ideal de irrigação para o tomate?'},
                    {label:'Fertilização', text:'Quais nutrientes preciso aplicar no plantio do milho?'},
                  ].map(s => (
                    <button key={s.label} className="suggestion" onClick={() => { setInputVal(s.text); setCharCount(s.text.length); textareaRef.current?.focus(); }}>
                      <div className="suggestion-label">{s.label}</div>
                      <div className="suggestion-text">{s.text}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className="message">
                <div className={`msg-avatar ${msg.role === 'user' ? 'user' : 'bot'}`}>
                  {msg.role === 'user' ? uIni : PLANT_SVG}
                </div>
                <div className="msg-body">
                  <div className={`msg-name${msg.role === 'assistant' ? ' bot-name' : ''}`}>
                    {msg.role === 'user' ? (user?.name || 'Você') : 'AgroBot'}
                  </div>
                  <div className="msg-text" dangerouslySetInnerHTML={{ __html: msg.html }} />
                  {msg.files?.map((f, i) => f.type?.startsWith('image/')
                    ? <img key={i} src={f.data} className="msg-img" alt={f.name} />
                    : <div key={i} className="msg-file-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>{f.name}</div>
                  )}
                  {msg.role === 'assistant' && !msg.streaming && (
                    <>
                      <div className="msg-actions">
                        <button className="msg-action" onClick={() => copyMsg(msg.text)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copiar
                        </button>
                      </div>
                      <div className="doc-action-bar">
                        <button className="doc-btn pdf" onClick={() => generatePDF('Resposta AgroBot', msg.text)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>Baixar PDF
                        </button>
                        <button className="doc-btn word" onClick={() => generateWord('Resposta AgroBot', msg.text)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Baixar Word
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message">
                <div className="msg-avatar bot">{PLANT_SVG}</div>
                <div className="msg-body">
                  <div className="msg-name bot-name">AgroBot</div>
                  <div className="typing"><div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* File preview */}
        {pendingFiles.length > 0 && (
          <div className="file-preview-bar">
            {pendingFiles.map((f, i) => (
              <div key={i} className="file-chip">
                {f.type?.startsWith('image/') && <img src={f.data} className="file-chip-img" alt="" />}
                <span className="file-chip-name">{f.name}</span>
                <button className="file-chip-rm" onClick={() => setPendingFiles(prev => prev.filter((_,j) => j!==i))}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="input-area">
          <div className="input-wrap">
            <div className="input-row">
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder="Descreva seu problema agrícola..."
                rows={1}
                value={inputVal}
                onKeyDown={handleKey}
                onChange={handleInput}
              />
              <div className="input-actions">
                <button className={`input-btn${pendingFiles.length > 0 ? ' has-files' : ''}`} title="Anexar foto ou arquivo" onClick={() => fileInputRef.current?.click()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </button>
                <input ref={fileInputRef} type="file" style={{display:'none'}} multiple accept="image/*,.pdf,.txt,.csv,.xlsx,.doc,.docx" onChange={handleFiles} />
                <button className="send-btn" onClick={sendMessage} disabled={!canSend}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
                </button>
              </div>
            </div>
          </div>
          <div className="input-extras">
            <span className="input-hint">Enter para enviar &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> nova linha</span>
            <span className="char-count">{charCount > 0 ? `${charCount} chars` : ''}</span>
          </div>
        </div>
      </main>

      {/* ══ EDIT PROFILE MODAL ══ */}
      <div className={`chat-modal-overlay${editModalOpen ? ' open' : ''}`}>
        <div className="chat-modal">
          <h2>Editar perfil</h2>
          <p>Atualize suas informações.</p>
          <div className="chat-modal-field">
            <label>Nome</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} maxLength={30} onKeyDown={e => e.key==='Enter' && updateUser()} />
          </div>
          <div className="chat-modal-field">
            <label>Perfil</label>
            <input type="text" value={editPlan} onChange={e => setEditPlan(e.target.value)} maxLength={40} />
          </div>
          <div className="modal-btns">
            <button className="modal-btn secondary" onClick={() => setEditModalOpen(false)}>Cancelar</button>
            <button className="modal-btn primary" onClick={updateUser}>Salvar</button>
          </div>
        </div>
      </div>

      {/* ══ SETTINGS PANEL ══ */}
      <div className={`settings-panel${settingsOpen ? ' open' : ''}`}>
        <div className="settings-backdrop" onClick={() => setSettingsOpen(false)} />
        <div className="settings-box">
          <div className="settings-header">
            <h2>Configurações</h2>
            <button className="settings-close" onClick={() => setSettingsOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="settings-section">
            <h3>Aparência</h3>
            <div className="settings-row">
              <div className="settings-label">Modo compacto <small>Menos espaço entre mensagens</small></div>
              <div className={`toggle${settings.compact ? ' on' : ''}`} onClick={() => setSettings(s => ({...s, compact: !s.compact}))} />
            </div>
            <div className="settings-row">
              <div className="settings-label">Animações <small>Efeitos de entrada das mensagens</small></div>
              <div className={`toggle${settings.anim ? ' on' : ''}`} onClick={() => setSettings(s => ({...s, anim: !s.anim}))} />
            </div>
          </div>
          <div className="settings-section">
            <h3>Conversa</h3>
            <div className="settings-row">
              <div className="settings-label">Idioma das respostas <small>Idioma padrão do AgroBot</small></div>
              <select className="settings-select" value={settings.lang} onChange={e => setSettings(s => ({...s, lang: e.target.value}))}>
                <option value="pt-BR">Português BR</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div className="settings-row">
              <div className="settings-label">Máx. tokens <small>Tamanho máximo da resposta</small></div>
              <input type="number" className="settings-input-n" value={settings.tokens} min={200} max={4000} step={100} onChange={e => setSettings(s => ({...s, tokens: parseInt(e.target.value)||1000}))} />
            </div>
          </div>
          <div className="settings-section">
            <h3>Dados</h3>
            <div className="settings-row">
              <div className="settings-label">Limpar histórico <small>Remove conversas da lista</small></div>
              <button className="settings-danger-btn" onClick={() => { setHistoryItems([]); setSettingsOpen(false); }}>Limpar</button>
            </div>
          </div>
          <button className="settings-save-btn" onClick={saveSettings}>Salvar configurações</button>
        </div>
      </div>

      {/* ══ TOAST ══ */}
      <div className={`agro-toast${toastVisible ? ' show' : ''}`}>{toast}</div>
    </div>
  );
}
