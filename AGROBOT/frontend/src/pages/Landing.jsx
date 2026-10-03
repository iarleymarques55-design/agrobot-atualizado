import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '';

const PLANT_SVG = (
  <svg viewBox="0 0 24 24" fill="none" style={{width:16,height:16}}>
    <path d="M12 22V12" stroke="#A3E635" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 12C12 12 7 11 5 6C5 6 10 4 14 8C14 8 16 10 12 12Z" fill="#A3E635" fillOpacity="0.4" stroke="#A3E635" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M12 17C12 17 16 15 18 10C18 10 13 9 10 14C10 14 9 16 12 17Z" fill="#4ADE80" fillOpacity="0.35" stroke="#4ADE80" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

const TICKER_ITEMS = [
  { label: 'Análise de Solo', val: 'pH · Nutrientes · CTC' },
  { label: 'Manejo de Pragas', val: 'MIP · Diagnóstico Visual' },
  { label: 'Irrigação', val: 'Gotejamento · Pivô · Aspersão' },
  { label: 'Culturas', val: 'Soja · Milho · Café · Cana' },
  { label: 'Fertilização', val: 'NPK · Micronutrientes' },
  { label: 'Exportar', val: 'PDF · Word · Markdown' },
  { label: 'Sustentabilidade', val: 'Plantio Direto · Rotação' },
  { label: 'Zoneamento', val: 'Clima · Safra · Risco' },
];

const FEATURES = [
  { num:'01', icon:'🌱', title:'Análise de Solo', desc:'pH, CTC, saturação de bases — o AgroBot interpreta laudos e recomenda calagem, adubação e correções com base técnica.', tag:'Edafologia' },
  { num:'02', icon:'🐛', title:'Pragas & Doenças', desc:'Envie fotos ou descreva sintomas. O bot identifica agentes causais e recomenda manejo integrado (MIP) ou produtos homologados.', tag:'Fitossanidade' },
  { num:'03', icon:'💧', title:'Irrigação Precisa', desc:'Cálculo de lâmina, frequência e turno de rega por cultura, estádio fenológico e sistema de irrigação utilizado.', tag:'Manejo Hídrico' },
  { num:'04', icon:'📊', title:'Fertilização & Adubação', desc:'Planos de adubação de plantio, cobertura e foliar. Considera análise de solo, exportação da cultura e histórico da área.', tag:'Nutrição de Plantas' },
  { num:'05', icon:'📄', title:'Geração de Documentos', desc:'Gere receituários agronômicos, laudos técnicos, relatórios de diagnóstico e planos de manejo em PDF ou Word — com um clique.', tag:'Documentação' },
  { num:'06', icon:'🛰️', title:'Visão Computacional', desc:'Análise de imagens de campo: identifica plantas, pragas, deficiências nutricionais, estresses abióticos e bióticos em fotos.', tag:'IA Multimodal' },
];

const STEPS = [
  { num:'01', title:'Cadastre-se', desc:'Crie sua conta gratuitamente. Apenas nome e e-mail — sem cartão de crédito.' },
  { num:'02', title:'Descreva o problema', desc:'Escreva sobre sua lavoura, envie uma foto do campo ou da planta com sintomas.' },
  { num:'03', title:'Receba diagnóstico', desc:'O AgroBot analisa e entrega recomendação técnica precisa em segundos.' },
  { num:'04', title:'Exporte o relatório', desc:'Baixe o laudo ou receituário em PDF, Word ou Markdown para usar no campo.' },
];

export default function Landing() {
  const navigate = useNavigate();

  // Se já logado, vai direto pro chat
  useEffect(() => {
    if (sessionStorage.getItem('agro_token')) navigate('/chat');
  }, []);

  // ── Modal state ──
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('login'); // 'login' | 'signup'

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginPassVisible, setLoginPassVisible] = useState(false);

  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupPassConfirm, setSignupPassConfirm] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupPassVisible, setSignupPassVisible] = useState(false);
  const [signupConfirmVisible, setSignupConfirmVisible] = useState(false);

  // Google
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/config`)
      .then(r => r.json())
      .then(d => setGoogleClientId(d.googleClientId || ''))
      .catch(() => {});
  }, []);

  function openModal(tab) {
    setModalTab(tab);
    setLoginError(''); setSignupError('');
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); }
  function switchTab(tab) {
    setModalTab(tab);
    setLoginError(''); setSignupError('');
  }

  // ── Login ──
  async function doLogin() {
    setLoginError('');
    if (!loginEmail || !loginPass) { setLoginError('Preencha e-mail e senha.'); return; }
    try {
      const r = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      const data = await r.json();
      if (!r.ok) { setLoginError(data.error || 'Credenciais inválidas.'); return; }
      sessionStorage.setItem('agro_token', data.token);
      sessionStorage.setItem('agro_user', JSON.stringify(data.user));
      navigate('/chat');
    } catch { setLoginError('Erro de conexão. Tente novamente.'); }
  }

  // ── Signup ──
  async function doSignup() {
    setSignupError('');
    if (!signupName || !signupEmail || !signupPass || !signupPassConfirm) {
      setSignupError('Preencha todos os campos.'); return;
    }
    if (signupPass.length < 8) { setSignupError('Senha mínimo 8 caracteres.'); return; }
    if (signupPass !== signupPassConfirm) { setSignupError('As senhas não coincidem.'); return; }
    try {
      const r = await fetch(`${API}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPass }),
      });
      const data = await r.json();
      if (!r.ok) { setSignupError(data.error || 'Erro ao criar conta.'); return; }
      sessionStorage.setItem('agro_token', data.token);
      sessionStorage.setItem('agro_user', JSON.stringify(data.user));
      navigate('/chat');
    } catch { setSignupError('Erro de conexão. Tente novamente.'); }
  }

  // ── Google Sign-In ──
  function googleSignIn() {
    if (!googleClientId) {
      const errSetter = modalTab === 'login' ? setLoginError : setSignupError;
      errSetter('Login com Google não configurado. Defina GOOGLE_CLIENT_ID no servidor.');
      return;
    }
    setGoogleLoading(true);
    window.google?.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: 'openid email profile',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) { setGoogleLoading(false); return; }
        try {
          const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: 'Bearer ' + tokenResponse.access_token }
          });
          const user = await r.json();
          const authResp = await fetch(`${API}/api/google-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: user.name, email: user.email, picture: user.picture, sub: user.sub }),
          });
          const authData = await authResp.json();
          if (!authResp.ok) {
            setGoogleLoading(false);
            const msg = authData.detail || authData.error || 'Falha ao autenticar com o servidor.';
            if (modalTab === 'login') setLoginError(msg);
            else setSignupError(msg);
            return;
          }
          sessionStorage.setItem('agro_token', authData.token);
          sessionStorage.setItem('agro_user', JSON.stringify(authData.user));
          navigate('/chat');
        } catch {
          setGoogleLoading(false);
          const msg = 'Erro de conexão com o backend. Verifique se o servidor está rodando.';
          if (modalTab === 'login') setLoginError(msg);
          else setSignupError(msg);
        }
      },
      error_callback: () => {
        setGoogleLoading(false);
        const msg = 'Login com Google cancelado ou não autorizado.';
        if (modalTab === 'login') setLoginError(msg);
        else setSignupError(msg);
      },
    }).requestAccessToken({ prompt: 'select_account' });
  }

  const EyeOpen = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
  const EyeOff = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  return (
    <>
      {/* Google GSI SDK */}
      <script src="https://accounts.google.com/gsi/client" async defer />

      <div className="glow-orb glow-1" />
      <div className="glow-orb glow-2" />

      {/* ══ NAV ══ */}
      <nav className="landing-nav">
        <a className="nav-logo" href="/">
          <div className="logo-icon">
            {PLANT_SVG}
          </div>
          <span className="logo-name">AGRO<span>BOT</span></span>
        </a>
        <div className="nav-links">
          <a className="nav-link" href="#funcionalidades">Funcionalidades</a>
          <a className="nav-link" href="#processo">Processo</a>
          <a className="nav-link" href="#planos">Planos</a>
        </div>
        <div className="nav-actions">
          <button className="btn-ghost" onClick={() => openModal('login')}>Entrar</button>
          <button className="btn-primary" onClick={() => openModal('signup')}>Cadastro</button>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-tag">
            <div className="tag-dot" />
            Sistema ativo · Agronomia de precisão
          </div>
          <h1 className="hero-title">
            Inteligência<br/>
            <span className="accent">agrícola</span><br/>
            <span className="outline">de precisão.</span>
          </h1>
          <p className="hero-sub">Diagnóstico · Análise · Recomendação</p>
          <p className="hero-desc">
            AgroBot é um assistente de IA especializado em agronomia. Análise de solo, manejo de pragas,
            irrigação, fertilização — com precisão técnica e linguagem acessível para todo tipo de produtor.
          </p>
          <div className="hero-cta">
            <button className="btn-cta" onClick={() => openModal('signup')}>COMEÇAR GRÁTIS →</button>
            <button className="btn-demo" onClick={() => openModal('login')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              VER O CHAT
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat"><span className="stat-val">8+</span><span className="stat-label">Especialidades</span></div>
            <div className="stat"><span className="stat-val">24h</span><span className="stat-label">Disponível</span></div>
            <div className="stat"><span className="stat-val">∞</span><span className="stat-label">Consultas</span></div>
          </div>
        </div>

        <div className="hero-bot-wrap">
          <div className="bot-container">
            <div className="ring ring-1"/>
            <div className="ring ring-2"/>
            <div className="ring ring-3"/>
            <div className="orbit-dot"/>
            <div className="orbit-dot"/>
            <div className="orbit-dot"/>
            <div className="bot-svg-wrap">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" width="160" height="160">
                {/* Robot body */}
                <rect x="50" y="80" width="100" height="90" rx="12" fill="#141A12" stroke="#A3E635" strokeWidth="1.5"/>
                {/* Robot head */}
                <rect x="60" y="45" width="80" height="60" rx="10" fill="#1A2217" stroke="#A3E635" strokeWidth="1.5"/>
                {/* Eyes */}
                <circle cx="82" cy="72" r="8" fill="#0B0E0A" stroke="#A3E635" strokeWidth="1.5"/>
                <circle cx="118" cy="72" r="8" fill="#0B0E0A" stroke="#A3E635" strokeWidth="1.5"/>
                <circle cx="85" cy="70" r="3" fill="#A3E635"/>
                <circle cx="121" cy="70" r="3" fill="#A3E635"/>
                {/* Antenna */}
                <line x1="100" y1="45" x2="100" y2="25" stroke="#A3E635" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="100" cy="20" r="6" fill="#A3E635" opacity="0.8"/>
                {/* Mouth */}
                <rect x="82" y="86" width="36" height="5" rx="2.5" fill="#A3E635" opacity="0.4"/>
                {/* Chest panel */}
                <rect x="65" y="100" width="70" height="50" rx="8" fill="#0F1310" stroke="rgba(163,230,53,0.2)" strokeWidth="1"/>
                {/* Chest icon — leaf */}
                <path d="M100 142V128" stroke="#A3E635" strokeWidth="2" strokeLinecap="round"/>
                <path d="M100 128C100 128 92 127 89 121C89 121 95 119 100 124C100 124 103 126 100 128Z" fill="#A3E635" fillOpacity="0.5" stroke="#A3E635" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M100 134C100 134 107 132 110 126C110 126 104 125 100 131C100 131 99 133 100 134Z" fill="#4ADE80" fillOpacity="0.45" stroke="#4ADE80" strokeWidth="1.2" strokeLinejoin="round"/>
                {/* Arms */}
                <rect x="20" y="90" width="28" height="14" rx="7" fill="#141A12" stroke="#A3E635" strokeWidth="1.2"/>
                <rect x="152" y="90" width="28" height="14" rx="7" fill="#141A12" stroke="#A3E635" strokeWidth="1.2"/>
                {/* Legs */}
                <rect x="65" y="168" width="28" height="20" rx="8" fill="#141A12" stroke="#A3E635" strokeWidth="1.2"/>
                <rect x="107" y="168" width="28" height="20" rx="8" fill="#141A12" stroke="#A3E635" strokeWidth="1.2"/>
              </svg>
            </div>
            <div className="data-tag">SOLO pH 6.2</div>
            <div className="data-tag">MIP ATIVO</div>
            <div className="data-tag">NPK OK</div>
            <div className="data-tag">IRRIGAÇÃO 85%</div>
          </div>
        </div>
      </section>

      {/* ══ TICKER ══ */}
      <div className="ticker-bar">
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div key={i} className="ticker-item">
              <span>●</span>
              {item.label}
              <span style={{opacity:.5,marginLeft:4}}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ FEATURES ══ */}
      <section className="features-section" id="funcionalidades">
        <p className="sec-eyebrow">Funcionalidades</p>
        <h2 className="sec-title">Tudo que o agrônomo moderno precisa</h2>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.num} className="feat-card">
              <div className="feat-num">{f.num}</div>
              <div className="feat-icon">{f.icon}</div>
              <div className="feat-title">{f.title}</div>
              <div className="feat-desc">{f.desc}</div>
              <div className="feat-tag">{f.tag}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="how-section" id="processo">
        <p className="sec-eyebrow">Como funciona</p>
        <h2 className="sec-title">Do campo ao diagnóstico em 4 passos</h2>
        <div className="how-steps">
          {STEPS.map(s => (
            <div key={s.num} className="step">
              <div className="step-num">{s.num}</div>
              <div className="step-line"/>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section className="pricing-section" id="planos">
        <p className="sec-eyebrow">Planos</p>
        <h2 className="sec-title">Simples e transparente</h2>
        <div className="pricing-grid">
          <div className="price-card">
            <div className="price-name">Básico</div>
            <div className="price-val">R$0<span>/mês</span></div>
            <div className="price-period">Grátis para sempre</div>
            <ul className="price-features">
              <li>Consultas ilimitadas</li>
              <li>Diagnóstico por texto e imagem</li>
              <li>Exportação PDF e Word</li>
              <li>Histórico de conversas</li>
            </ul>
            <button className="btn-plan" onClick={() => openModal('signup')}>Começar grátis →</button>
          </div>
          <div className="price-card featured">
            <div className="price-badge">EM BREVE</div>
            <div className="price-name">Pro</div>
            <div className="price-val">R$49<span>/mês</span></div>
            <div className="price-period">Por profissional</div>
            <ul className="price-features">
              <li>Tudo do plano básico</li>
              <li>Modelos de IA avançados</li>
              <li>Receituários agronômicos oficiais</li>
              <li>Suporte prioritário</li>
            </ul>
            <button className="btn-plan solid" onClick={() => openModal('signup')}>Acessar grátis agora →</button>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="cta-section">
        <div className="cta-box">
          <h2 className="cta-title">Pronto para o campo inteligente?</h2>
          <p className="cta-desc">Junte-se a produtores e agrônomos que já usam IA para tomar decisões mais precisas no campo.</p>
          <div className="cta-btns">
            <button className="btn-cta" onClick={() => openModal('signup')}>CRIAR CONTA GRÁTIS →</button>
            <button className="btn-demo" onClick={() => openModal('login')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              ENTRAR
            </button>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="landing-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="logo-name">AGRO<span>BOT</span></div>
            <p>Assistente de agronomia com inteligência artificial. Diagnóstico técnico imediato para produtores e agrônomos.</p>
          </div>
          <div className="footer-col">
            <h4>Produto</h4>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#processo">Como funciona</a>
            <a href="#planos">Planos</a>
          </div>
          <div className="footer-col">
            <h4>Acesso</h4>
            <a href="#" onClick={() => openModal('signup')}>Criar conta</a>
            <a href="#" onClick={() => openModal('login')}>Entrar</a>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">Termos de Uso</a>
            <a href="#">Privacidade</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© 2026 AgroBot. Todos os direitos reservados.</span>
          <span className="footer-copy">Feito com IA · Node.js · React</span>
        </div>
      </footer>

      {/* ══ AUTH MODAL ══ */}
      <div className={`modal-overlay${modalOpen ? ' active' : ''}`} onClick={e => { if(e.target === e.currentTarget) closeModal(); }}>
        <div className="auth-modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={closeModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          <div className="modal-logo">
            <div className="modal-logo-icon">{PLANT_SVG}</div>
            <span className="modal-logo-name">AGRO<span>BOT</span></span>
          </div>

          {/* ── LOGIN FORM ── */}
          {modalTab === 'login' && (
            <>
              <div className="modal-header">
                <h2>Bem-vindo de volta</h2>
                <p>Entre para continuar no AgroBot</p>
              </div>
              <div className="social-btns">
                <button
                  className={`btn-social${googleLoading ? ' loading' : ''}`}
                  onClick={googleSignIn}
                >
                  {!googleLoading && (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  {googleLoading ? 'Aguardando Google...' : 'Continuar com o Google'}
                </button>
              </div>
              <div className="modal-divider"><span>ou entre com e-mail</span></div>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input className="form-input" type="email" placeholder="seu@email.com"
                  value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doLogin()} />
              </div>
              <div className="form-group">
                <label className="form-label">Senha</label>
                <div className="pass-wrap">
                  <input className="form-input" type={loginPassVisible ? 'text' : 'password'}
                    placeholder="••••••••" value={loginPass} onChange={e => setLoginPass(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doLogin()} style={{paddingRight:44}} />
                  <button type="button" className="pass-toggle" onClick={() => setLoginPassVisible(v => !v)}>
                    {loginPassVisible ? <EyeOff/> : <EyeOpen/>}
                  </button>
                </div>
              </div>
              {loginError && <div className="form-error">⚠ {loginError}</div>}
              <button className="form-submit" onClick={doLogin}>Entrar →</button>
              <p className="modal-switch">Não tem conta? <a onClick={() => switchTab('signup')}>Cadastre-se grátis</a></p>
            </>
          )}

          {/* ── SIGNUP FORM ── */}
          {modalTab === 'signup' && (
            <>
              <div className="modal-header">
                <h2>Criar conta</h2>
                <p>Comece gratuitamente hoje</p>
              </div>
              <div className="social-btns">
                <button
                  className={`btn-social${googleLoading ? ' loading' : ''}`}
                  onClick={googleSignIn}
                >
                  {!googleLoading && (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  {googleLoading ? 'Aguardando Google...' : 'Continuar com o Google'}
                </button>
              </div>
              <div className="modal-divider"><span>ou cadastre com e-mail</span></div>
              <div className="form-group">
                <label className="form-label">Nome completo</label>
                <input className="form-input" type="text" placeholder="João Silva"
                  value={signupName} onChange={e => setSignupName(e.target.value)} maxLength={30} />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input className="form-input" type="email" placeholder="seu@email.com"
                  value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Senha</label>
                <div className="pass-wrap">
                  <input className="form-input" type={signupPassVisible ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres" value={signupPass}
                    onChange={e => setSignupPass(e.target.value)} style={{paddingRight:44}} />
                  <button type="button" className="pass-toggle" onClick={() => setSignupPassVisible(v => !v)}>
                    {signupPassVisible ? <EyeOff/> : <EyeOpen/>}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar senha</label>
                <div className="pass-wrap">
                  <input className="form-input" type={signupConfirmVisible ? 'text' : 'password'}
                    placeholder="Repita a senha" value={signupPassConfirm}
                    onChange={e => setSignupPassConfirm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doSignup()}
                    style={{paddingRight:44}} />
                  <button type="button" className="pass-toggle" onClick={() => setSignupConfirmVisible(v => !v)}>
                    {signupConfirmVisible ? <EyeOff/> : <EyeOpen/>}
                  </button>
                </div>
              </div>
              {signupError && <div className="form-error">⚠ {signupError}</div>}
              <button className="form-submit" onClick={doSignup}>Criar conta grátis →</button>
              <p className="modal-switch">Já tem conta? <a onClick={() => switchTab('login')}>Entrar</a></p>
              <p className="modal-terms">Ao continuar, você concorda com os <a href="#">Termos de Uso</a> e <a href="#">Privacidade</a>.</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
