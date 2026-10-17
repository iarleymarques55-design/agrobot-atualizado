import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, authHeader, cacheUser, clearSession, getCachedUser, getToken, logoutSession } from '../api/client';
import { createConversation, listConversations, listMessages, saveMessage, streamChat } from '../api/chat';
import { escapeHtml, fmtMd } from '../utils/markdown';
import { generatePDF } from '../utils/exportPdf';
import { exportConversation, generateWord } from '../utils/exportWord';
import { loadSettings, saveSettings } from '../utils/settings';
import { useToast } from '../hooks/useToast';
import Sidebar from '../components/chat/Sidebar';
import ChatTopbar from '../components/chat/ChatTopbar';
import Welcome from '../components/chat/Welcome';
import MessageBubble, { TypingIndicator } from '../components/chat/MessageBubble';
import Composer from '../components/chat/Composer';
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE, MAX_IMAGES } from '../utils/images';
import ProfileModal from '../components/modals/ProfileModal';
import SettingsModal from '../components/modals/SettingsModal';

const IMAGE_PLACEHOLDER = '[imagem enviada]';
const REPORT_TITLE = 'Laudo Técnico AgroBot';

// Cada conversa aberta na tela tem um id de "visão": `server_<uuid>` para conversas
// salvas e `draft_<n>` para uma conversa nova que ainda não foi criada no servidor.
let draftCounter = 0;
const newDraftId = () => `draft_${++draftCounter}`;

function toHistoryItem(c) {
  return {
    id: `server_${c.id}`,
    title: c.title || 'Consulta agronômica',
    date: c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : 'Hoje',
    serverId: c.id,
  };
}

export default function Chat() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [historyItems, setHistoryItems] = useState([]);
  const [activeId, setActiveId] = useState(newDraftId);
  const [activeServerId, setActiveServerId] = useState(null);
  const [streamingViews, setStreamingViews] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const { toast, visible: toastVisible, showToast } = useToast();

  const chatAreaRef = useRef(null);
  const textareaRef = useRef(null);
  // Estado das conversas que não estão na tela (inclusive as que ainda recebem streaming)
  const convSnapshotsRef = useRef({});
  // Sempre aponta para a conversa visível — lido dentro de callbacks assíncronos
  const activeIdRef = useRef(activeId);

  useEffect(() => {
    if (!getToken()) {
      navigate('/');
      return;
    }
    fetch(`${API}/api/me`, { headers: authHeader() })
      .then(async (r) => {
        if (r.status === 401) {
          // Sessão encerrada ou expirada no servidor
          clearSession();
          navigate('/');
          return;
        }
        if (!r.ok) throw new Error('me');
        const data = await r.json();
        cacheUser(data.user);
        setUser(data.user);
        const convs = await listConversations();
        setHistoryItems(convs.map(toHistoryItem));
      })
      .catch(() => {
        const cached = getCachedUser();
        if (cached) setUser(cached);
        else navigate('/');
      });
  }, [navigate]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  function activate(id) {
    activeIdRef.current = id;
    setActiveId(id);
  }

  /** Atualiza a conversa `viewId`: na tela, se ela estiver ativa; senão, no snapshot guardado. */
  function updateView(viewId, updateMessages, updateHistory) {
    if (activeIdRef.current === viewId) {
      if (updateMessages) setMessages(updateMessages);
      if (updateHistory) setConversationHistory(updateHistory);
      return;
    }
    const snap = convSnapshotsRef.current[viewId];
    if (!snap) return;
    if (updateMessages) snap.messages = updateMessages(snap.messages);
    if (updateHistory) snap.history = updateHistory(snap.history);
  }

  /** Uma conversa nova ganhou id no servidor: troca o id da visão sem perder o que está em andamento. */
  function renameView(oldId, newId, serverId) {
    if (activeIdRef.current === oldId) {
      activate(newId);
      setActiveServerId(serverId);
    } else if (convSnapshotsRef.current[oldId]) {
      convSnapshotsRef.current[newId] = convSnapshotsRef.current[oldId];
      delete convSnapshotsRef.current[oldId];
    }
    setStreamingViews((v) => v.map((x) => (x === oldId ? newId : x)));
  }

  function snapshotActive() {
    if (messages.length > 0) {
      convSnapshotsRef.current[activeIdRef.current] = {
        messages,
        history: conversationHistory,
      };
    }
  }

  function addFiles(files) {
    let accepted = 0;
    files.forEach((file) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
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
  }

  const isTyping = streamingViews.includes(activeId);

  async function sendMessage() {
    const text = inputVal.trim();
    if (!text && pendingFiles.length === 0) return;
    if (isTyping) return;

    let viewId = activeIdRef.current;
    let serverId = activeServerId;
    const sentFiles = [...pendingFiles];
    const botId = `b_${Date.now()}`;

    setInputVal('');
    setPendingFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // As imagens vão só nesta requisição. No histórico guardado (e reenviado nas próximas
    // perguntas) elas viram um marcador de texto, para não reenviar megabytes a cada mensagem.
    const imageParts = sentFiles.map((f) => ({ type: 'image_url', image_url: { url: f.data } }));
    const requestContent = imageParts.length
      ? [...imageParts, ...(text ? [{ type: 'text', text }] : [])]
      : text;
    const storedContent = imageParts.length ? `${IMAGE_PLACEHOLDER} ${text}`.trim() : text;
    const requestHistory = [...conversationHistory, { role: 'user', content: requestContent }];

    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, role: 'user', html: fmtMd(text), text, files: sentFiles },
      { id: botId, role: 'assistant', html: '', text: '', streaming: true },
    ]);
    setConversationHistory([...conversationHistory, { role: 'user', content: storedContent }]);
    setShowWelcome(false);
    setStreamingViews((v) => [...v, viewId]);
    if (imageParts.length) {
      showToast('As fotos são analisadas nesta resposta, mas não ficam salvas no histórico.');
    }

    if (!serverId) {
      const snippet = text.slice(0, 36) || 'Análise de amostra';
      serverId = await createConversation(snippet);
      if (serverId) {
        const newViewId = `server_${serverId}`;
        renameView(viewId, newViewId, serverId);
        viewId = newViewId;
        setHistoryItems((prev) => [
          {
            id: newViewId,
            title: snippet,
            date: 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            serverId,
          },
          ...prev,
        ]);
      }
    }

    if (serverId) saveMessage(serverId, 'user', storedContent);

    const setBot = (patch) =>
      updateView(viewId, (msgs) => msgs.map((m) => (m.id === botId ? { ...m, ...patch } : m)));

    try {
      const accumulated = await streamChat({
        messages: requestHistory,
        lang: settings.lang,
        maxTokens: settings.tokens,
        onText: (acc) => setBot({ html: fmtMd(acc), text: acc }),
      });

      const finalText = accumulated || 'Sem resposta para esta consulta no momento.';
      setBot({ html: fmtMd(finalText), text: finalText, streaming: false });
      updateView(viewId, null, (h) => [...h, { role: 'assistant', content: finalText }]);
      if (serverId) saveMessage(serverId, 'assistant', finalText);
    } catch (err) {
      const msg = err.message || 'Falha na comunicação técnica.';
      setBot({
        html: `<div class="agro-alert error">${escapeHtml(msg)}</div>`,
        text: msg,
        streaming: false,
        isError: true,
      });
    } finally {
      setStreamingViews((v) => v.filter((x) => x !== viewId));
    }
  }

  function newChat() {
    snapshotActive();
    activate(newDraftId());
    setActiveServerId(null);
    setMessages([]);
    setConversationHistory([]);
    setShowWelcome(true);
    setSidebarOpen(false);
  }

  async function loadConversation(item) {
    try {
      const rows = await listMessages(item.serverId);
      // O usuário pode ter trocado de conversa enquanto carregava
      if (!rows || activeIdRef.current !== item.id) return;
      const parsed = rows.map((m, i) => ({
        id: `srv_${m.id || i}`,
        role: m.role,
        html: fmtMd(m.content || ''),
        text: m.content || '',
        files: [],
      }));
      setMessages(parsed);
      setShowWelcome(parsed.length === 0);
      setConversationHistory(parsed.map((m) => ({ role: m.role, content: m.text })));
    } catch {
      // Sem rede: a conversa fica vazia até a próxima tentativa
    }
  }

  function selectHistory(item) {
    setSidebarOpen(false);
    if (item.id === activeIdRef.current) return;

    snapshotActive();
    activate(item.id);
    setActiveServerId(item.serverId || null);
    setInputVal('');

    const snap = convSnapshotsRef.current[item.id];
    if (snap) {
      setMessages(snap.messages);
      setConversationHistory(snap.history);
      setShowWelcome(snap.messages.length === 0);
      return;
    }

    setMessages([]);
    setConversationHistory([]);
    setShowWelcome(false);
    loadConversation(item);
  }

  async function logout() {
    await logoutSession();
    navigate('/');
  }

  async function updateUser(values) {
    setUser((u) => ({ ...(u || {}), ...values }));
    setProfileOpen(false);
    showToast('Perfil atualizado com sucesso.');

    try {
      const r = await fetch(`${API}/api/me`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify(values),
      });
      if (r.ok) {
        const d = await r.json();
        if (d?.user) {
          setUser(d.user);
          cacheUser(d.user);
        }
      }
    } catch {
      // Mantém a atualização otimista; o servidor sincroniza no próximo /api/me
    }
  }

  function applySettings(next) {
    setSettings(next);
    saveSettings(next);
    setSettingsOpen(false);
    showToast('Preferências salvas.');
  }

  function copyMsg(text) {
    navigator.clipboard.writeText(text).then(() => showToast('Texto copiado para a área de transferência.'));
  }

  function copyAllChat() {
    setExportOpen(false);
    let out = '';
    messages.forEach((m) => {
      const who = m.role === 'user' ? userName : 'AgroBot';
      out += `**${who}**:\n${m.text}\n\n`;
    });
    navigator.clipboard.writeText(out).then(() => showToast('Conversa copiada com sucesso.'));
  }

  const userName = user?.name || 'Usuário';
  const userRole = user?.profession || 'Conta gratuita';
  const canSend = (inputVal.trim().length > 0 || pendingFiles.length > 0) && !isTyping;

  return (
    <div className="agro-chat-viewport">
      <div
        className={`agro-sidebar-scrim${sidebarOpen ? ' is-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ══ SIDEBAR DO WORKSPACE ══ */}
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        onBrandClick={() => navigate('/')}
        historyItems={historyItems}
        activeId={activeId}
        onNewChat={newChat}
        onSelect={selectHistory}
        userName={userName}
        userRole={userRole}
        userMenuOpen={userMenuOpen}
        onToggleUserMenu={() => setUserMenuOpen((o) => !o)}
        onEditProfile={() => {
          setUserMenuOpen(false);
          setProfileOpen(true);
        }}
        onOpenSettings={() => {
          setUserMenuOpen(false);
          setSettingsOpen(true);
        }}
        onLogout={logout}
      />

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

        <ChatTopbar
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          exportOpen={exportOpen}
          onToggleExport={() => setExportOpen((o) => !o)}
          onExport={(ext) => {
            setExportOpen(false);
            exportConversation(messages, userName, ext);
          }}
          onCopyAll={copyAllChat}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Área de mensagens */}
        <div className="agro-messages-stage" ref={chatAreaRef}>
          <div className="agro-messages-wrapper">
            {showWelcome && (
              <Welcome
                onPickSuggestion={(prompt) => {
                  setInputVal(prompt);
                  textareaRef.current?.focus();
                }}
              />
            )}

            {messages.length > 0 && (
              <div className="agro-bubbles-container">
                {messages.map((msg) =>
                  msg.streaming && !msg.text ? (
                    <TypingIndicator key={msg.id} />
                  ) : (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      userName={userName}
                      onCopy={copyMsg}
                      onPdf={(text) =>
                        generatePDF(REPORT_TITLE, text).then(() => showToast('PDF gerado e pronto para arquivamento.'))
                      }
                      onWord={(text) => {
                        generateWord(REPORT_TITLE, text);
                        showToast('Documento Word gerado com sucesso.');
                      }}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <Composer
          textareaRef={textareaRef}
          value={inputVal}
          onChange={setInputVal}
          onSend={sendMessage}
          canSend={canSend}
          pendingFiles={pendingFiles}
          onAddFiles={addFiles}
          onRemoveFile={(i) => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
        />
      </main>

      {/* ══ MODAL DE EDIÇÃO DE PERFIL ══ */}
      {profileOpen && (
        <ProfileModal
          initial={{
            name: user?.name || '',
            profession: user?.profession || '',
            registry: user?.registry || '',
          }}
          onSave={updateUser}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {/* ══ CONFIGURAÇÕES DO ASSISTENTE ══ */}
      {settingsOpen && (
        <SettingsModal
          initial={settings}
          onSave={applySettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* ══ NOTIFICAÇÃO TOAST ══ */}
      <div className={`agro-toast${toastVisible ? ' is-visible' : ''}`}>{toast}</div>
    </div>
  );
}
