import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AgroBotLogo from '../components/AgroBotLogo';

const API = import.meta.env.VITE_API_URL || '';

// ── Ícones Agronômicos e da Interface ──


const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconFlask = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2v7.31L4.2 18.1A2 2 0 0 0 5.86 21h12.28a2 2 0 0 0 1.66-2.9L14 9.31V2" />
    <line x1="8.5" y1="2" x2="15.5" y2="2" />
    <path d="M7 16h10" />
  </svg>
);

const IconSprout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 20h10" />
    <path d="M12 20v-8" />
    <path d="M12 12a5 5 0 0 1 5-5c0 4-3 7-5 7" />
    <path d="M12 12a5 5 0 0 0-5-5c0 4 3 7 5 7" />
  </svg>
);

const IconWheat = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 22l10-10" />
    <path d="M16 8l2-2a2 2 0 0 0-2.83-2.83l-2 2" />
    <path d="M11.17 12.83l2-2a2 2 0 0 0-2.83-2.83l-2 2" />
    <path d="M17.5 13.5l2-2a2 2 0 0 0-2.83-2.83l-2 2" />
  </svg>
);

const IconShieldCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const IconDoc = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconDrop = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconCamera = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconLayers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconClose = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Lista de Módulos Técnicos Reais (Seção 7 do Prompt) ──
const TECHNICAL_MODULES = [
  {
    id: 'pragas',
    title: 'Diagnóstico de pragas e doenças',
    desc: 'Identificação de pragas, doenças e sintomas com recomendações técnicas.',
    image: '/images/leaf_disease.jpg',
    badge: 'Análise de imagem',
    icon: <IconSprout />,
  },
  {
    id: 'solo',
    title: 'Análise de solo',
    desc: 'Interpretação de resultados laboratoriais e recomendações de correção do solo.',
    image: '/images/soil_analysis.jpg',
    badge: 'Química do solo',
    icon: <IconFlask />,
  },
  {
    id: 'insumos',
    title: 'Recomendação de insumos',
    desc: 'Orientação sobre insumos conforme a cultura, as condições e os dados disponíveis.',
    image: '/images/crop_inputs.jpg',
    badge: 'Nutrição e manejo',
    icon: <IconWheat />,
  },
  {
    id: 'irrigacao',
    title: 'Manejo de irrigação',
    desc: 'Orientações para o uso eficiente da água e a produtividade agrícola.',
    image: '/images/irrigation.jpg',
    badge: 'Engenharia hídrica',
    icon: <IconDrop />,
  },
  {
    id: 'laudos',
    title: 'Exportação de laudos',
    desc: 'Geração de relatórios técnicos em PDF e Word, conforme as funcionalidades existentes.',
    image: '/images/crop_sunset.jpg',
    badge: 'Documentação técnica',
    icon: <IconDoc />,
  },
];

// ── 4 Etapas da Metodologia Agronômica (Seção 8 do Prompt) ──
const METHODOLOGY_STEPS = [
  {
    num: '1',
    title: 'Coleta de dados',
    desc: 'Recebimento de imagens, informações da cultura e resultados de análises laboratoriais.',
    icon: <IconCamera />,
  },
  {
    num: '2',
    title: 'Análise técnica',
    desc: 'Interpretação das informações com base em critérios agronômicos e referências disponíveis.',
    icon: <IconFlask />,
  },
  {
    num: '3',
    title: 'Construção da recomendação',
    desc: 'Organização dos resultados e apresentação de orientações contextualizadas.',
    icon: <IconLayers />,
  },
  {
    num: '4',
    title: 'Documentação técnica',
    desc: 'Apresentação das informações em relatórios claros e rastreáveis, quando disponível.',
    icon: <IconDoc />,
  },
];

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('agro_token')) navigate('/chat');
  }, [navigate]);

  const [activeSection, setActiveSection] = useState('inicio');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('login'); // 'login' | 'signup' | 'verify'

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginPassVisible, setLoginPassVisible] = useState(false);

  // Signup
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

  // Verification
  const [verifEmail, setVerifEmail] = useState('');
  const [verifCode, setVerifCode] = useState('');
  const [verifError, setVerifError] = useState('');
  const [verifSuccessMsg, setVerifSuccessMsg] = useState('');
  const [verifLoading, setVerifLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  useEffect(() => {
    fetch(`${API}/api/config`)
      .then((r) => r.json())
      .then((d) => setGoogleClientId(d.googleClientId || ''))
      .catch(() => {});
  }, []);

  function openModal(tab) {
    setModalTab(tab);
    setLoginError('');
    setSignupError('');
    setVerifError('');
    setVerifSuccessMsg('');
    setResendSuccess('');
    setModalOpen(true);
    setMobileMenuOpen(false);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function switchTab(tab) {
    setModalTab(tab);
    setLoginError('');
    setSignupError('');
    setVerifError('');
    setVerifSuccessMsg('');
    setResendSuccess('');
  }

  function scrollToSection(id) {
    setActiveSection(id);
    setMobileMenuOpen(false);
    if (id === 'inicio') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 76;
      const elementPos = el.getBoundingClientRect().top;
      const targetPos = elementPos + window.pageYOffset - navOffset;
      window.scrollTo({
        top: targetPos,
        behavior: 'smooth',
      });
    }
  }

  async function doLogin() {
    setLoginError('');
    if (!loginEmail || !loginPass) {
      setLoginError('Preencha seu e-mail e senha cadastrados.');
      return;
    }
    try {
      const r = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      const data = await r.json();
      if (!r.ok) {
        setLoginError(data.error || 'Credenciais não conferem com nossos registros.');
        return;
      }
      if (data.requires_verification) {
        setVerifEmail(data.email || loginEmail);
        setVerifCode('');
        setVerifError('');
        setVerifSuccessMsg(data.message || 'Código enviado para seu e-mail.');
        setResendSuccess('');
        setModalTab('verify');
        return;
      }
      sessionStorage.setItem('agro_token', data.token);
      sessionStorage.setItem('agro_user', JSON.stringify(data.user));
      navigate('/chat');
    } catch {
      setLoginError('Falha ao comunicar com o servidor. Verifique a conexão.');
    }
  }

  async function doSignup() {
    setSignupError('');
    if (!signupName || !signupEmail || !signupPass || !signupPassConfirm) {
      setSignupError('Preencha todos os campos do formulário.');
      return;
    }
    if (signupPass.length < 8) {
      setSignupError('A senha precisa conter ao menos 8 caracteres.');
      return;
    }
    if (signupPass !== signupPassConfirm) {
      setSignupError('As senhas digitadas não coincidem.');
      return;
    }
    try {
      const r = await fetch(`${API}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPass }),
      });
      const data = await r.json();
      if (!r.ok) {
        setSignupError(data.error || 'Não foi possível efetuar o cadastro.');
        return;
      }
      setVerifEmail(signupEmail);
      setVerifCode('');
      setVerifError('');
      setVerifSuccessMsg(data.message || 'Código enviado para o e-mail informado.');
      setModalTab('verify');
    } catch {
      setSignupError('Falha na comunicação com o servidor.');
    }
  }

  async function doVerifyCode() {
    setVerifError('');
    if (!verifCode || verifCode.length < 6) {
      setVerifError('Digite o código numérico de 6 dígitos.');
      return;
    }
    setVerifLoading(true);
    try {
      const r = await fetch(`${API}/api/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifEmail, code: verifCode }),
      });
      const data = await r.json();
      setVerifLoading(false);
      if (!r.ok) {
        setVerifError(data.error || 'Código incorreto ou expirado.');
        return;
      }
      sessionStorage.setItem('agro_token', data.token);
      sessionStorage.setItem('agro_user', JSON.stringify(data.user));
      navigate('/chat');
    } catch {
      setVerifLoading(false);
      setVerifError('Erro de conexão ao validar código.');
    }
  }

  async function doResendVerification() {
    setVerifError('');
    setResendSuccess('');
    setResendLoading(true);
    try {
      const r = await fetch(`${API}/api/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifEmail }),
      });
      const data = await r.json();
      setResendLoading(false);
      if (!r.ok) {
        setVerifError(data.error || 'Não foi possível reenviar o código agora.');
        return;
      }
      setResendSuccess(data.message || 'Novo código de verificação enviado.');
    } catch {
      setResendLoading(false);
      setVerifError('Erro na conexão ao reenviar código.');
    }
  }

  function googleSignIn() {
    if (!googleClientId) {
      const errSetter = modalTab === 'login' ? setLoginError : setSignupError;
      errSetter('Autenticação Google ainda não configurada no servidor.');
      return;
    }
    setGoogleLoading(true);

    window.google?.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        if (!response.credential) {
          setGoogleLoading(false);
          const msg = 'Acesso Google cancelado ou não autorizado.';
          if (modalTab === 'login') setLoginError(msg);
          else setSignupError(msg);
          return;
        }
        try {
          const authResp = await fetch(`${API}/api/google-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: response.credential }),
          });
          const authData = await authResp.json();
          if (!authResp.ok) {
            setGoogleLoading(false);
            const msg = authData.detail || authData.error || 'Não foi possível autenticar com o Google.';
            if (modalTab === 'login') setLoginError(msg);
            else setSignupError(msg);
            return;
          }
          sessionStorage.setItem('agro_token', authData.token);
          sessionStorage.setItem('agro_user', JSON.stringify(authData.user));
          navigate('/chat');
        } catch {
          setGoogleLoading(false);
          const msg = 'Erro de conexão com o servidor de autenticação.';
          if (modalTab === 'login') setLoginError(msg);
          else setSignupError(msg);
        }
      },
      cancel_on_tap_outside: true,
    });
    window.google?.accounts.id.prompt((notification) => {
      if (notification.isSkippedMoment() || notification.isDismissedMoment()) {
        setGoogleLoading(false);
      }
    });
  }

  const EyeOpen = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeOff = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  return (
    <div className="agro-app">
      <script src="https://accounts.google.com/gsi/client" async defer />

      {/* ═════════════════════════════════════════════════════════════════
         4. NAVEGAÇÃO SUPERIOR (COMPACTA, HORIZONTAL, SEM SIDEBAR)
         Itens centrais: Início | Módulos técnicos | Metodologia
         ═════════════════════════════════════════════════════════════════ */}
      <header className="ag-navbar">
        <div className="ag-container ag-nav-inner">
          {/* Lado Esquerdo: Marca */}
          <div className="ag-brand" onClick={() => scrollToSection('inicio')}>
            <AgroBotLogo theme="light" height={38} />
          </div>

          {/* Centro: Apenas Início, Módulos técnicos, Metodologia */}
          <nav className="ag-nav-links" aria-label="Navegação principal">
            <button
              type="button"
              className={`ag-nav-link${activeSection === 'inicio' ? ' active' : ''}`}
              onClick={() => scrollToSection('inicio')}
            >
              Início
            </button>
            <button
              type="button"
              className={`ag-nav-link${activeSection === 'modulos' ? ' active' : ''}`}
              onClick={() => scrollToSection('modulos')}
            >
              Módulos técnicos
            </button>
            <button
              type="button"
              className={`ag-nav-link${activeSection === 'metodologia' ? ' active' : ''}`}
              onClick={() => scrollToSection('metodologia')}
            >
              Metodologia
            </button>
          </nav>

          {/* Lado Direito: Acesso à conta e CTA Iniciar diagnóstico */}
          <div className="ag-nav-actions">
            <button
              type="button"
              className="ag-btn-login"
              onClick={() => openModal('login')}
            >
              Acessar conta
            </button>
            <button
              type="button"
              className="ag-btn-cta-nav"
              onClick={() => openModal('signup')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              <span>Iniciar diagnóstico</span>
            </button>
          </div>

          {/* Botão Mobile Toggle */}
          <button
            type="button"
            className="ag-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Alternar menu de navegação"
          >
            {mobileMenuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>

        {/* Menu Recolhível Mobile (sem sidebar) */}
        {mobileMenuOpen && (
          <div className="ag-mobile-menu open">
            <button
              type="button"
              className="ag-mobile-link"
              onClick={() => scrollToSection('inicio')}
            >
              Início
            </button>
            <button
              type="button"
              className="ag-mobile-link"
              onClick={() => scrollToSection('modulos')}
            >
              Módulos técnicos
            </button>
            <button
              type="button"
              className="ag-mobile-link"
              onClick={() => scrollToSection('metodologia')}
            >
              Metodologia
            </button>
            <div className="ag-mobile-actions">
              <button
                type="button"
                className="ag-btn-login"
                style={{ textAlign: 'center' }}
                onClick={() => openModal('login')}
              >
                Acessar conta
              </button>
              <button
                type="button"
                className="ag-btn-cta-nav"
                style={{ justifyContent: 'center' }}
                onClick={() => openModal('signup')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
                <span>Iniciar diagnóstico</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ═════════════════════════════════════════════════════════════════
         5. PÁGINA INICIAL / HERO SECTION (LAYOUT INTEGRADO COM FOTOGRAFIA)
         ═════════════════════════════════════════════════════════════════ */}
      <section className="ag-hero" id="inicio">
        {/* Fotografia de fundo no lado direito com fade suave */}
        <div className="ag-hero-bg-photo" />

        <div className="ag-container" style={{ position: 'relative', zIndex: 2 }}>
          {/* Coluna de Conteúdo Textual à Esquerda */}
          <div className="ag-hero-content-col">
            <div className="ag-badge-info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#165337' }}>
                <path d="M7 20h10" />
                <path d="M12 20v-8" />
                <path d="M12 12a5 5 0 0 1 5-5c0 4-3 7-5 7" />
                <path d="M12 12a5 5 0 0 0-5-5c0 4 3 7 5 7" />
              </svg>
              <span>Suporte técnico para uma agricultura mais eficiente</span>
            </div>

            <h1 className="ag-hero-title">
              Diagnósticos agronômicos imediatos fundamentados na ciência do campo.
            </h1>

            <p className="ag-hero-text">
              O AgroBot traz a ciência da agronomia até o seu dia a dia, com análises precisas, recomendações técnicas e orientações personalizadas para a sua lavoura.
            </p>

            <div className="ag-hero-buttons">
              <button
                type="button"
                className="ag-btn-primary"
                onClick={() => openModal('signup')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Nova consulta técnica</span>
              </button>
              <button
                type="button"
                className="ag-btn-outline"
                onClick={() => scrollToSection('modulos')}
              >
                <IconLayers />
                <span>Ver módulos técnicos</span>
              </button>
            </div>
          </div>

          {/* 4 Cards na base do Hero */}
          <div className="ag-hero-bottom-grid">
            {/* Card 1: Normas MAPA */}
            <div className="ag-benefit-card" onClick={() => openModal('signup')}>
              <div>
                <div className="ag-benefit-icon">
                  <IconSprout />
                </div>
                <h3 className="ag-benefit-title">Normas MAPA</h3>
                <p className="ag-benefit-desc">Confira as normas e exigências para sua produção.</p>
              </div>
              <span className="ag-benefit-arrow"><IconArrowRight /></span>
            </div>

            {/* Card 2: Calibração em Tropical */}
            <div className="ag-benefit-card" onClick={() => openModal('signup')}>
              <div>
                <div className="ag-benefit-icon">
                  <IconFlask />
                </div>
                <h3 className="ag-benefit-title">Calibração em Tropical</h3>
                <p className="ag-benefit-desc">Coleta de variáveis, pH, NPK e textura.</p>
              </div>
              <span className="ag-benefit-arrow"><IconArrowRight /></span>
            </div>

            {/* Card 3: Exportação Direta */}
            <div className="ag-benefit-card" onClick={() => openModal('signup')}>
              <div>
                <div className="ag-benefit-icon">
                  <IconDoc />
                </div>
                <h3 className="ag-benefit-title">Exportação Direta</h3>
                <p className="ag-benefit-desc">Laudos e informações para o mercado internacional.</p>
              </div>
              <span className="ag-benefit-arrow"><IconArrowRight /></span>
            </div>

            {/* Card 4 Destaque: Verde Escuro Sólido */}
            <div className="ag-benefit-card is-highlight" onClick={() => openModal('signup')}>
              <div>
                <div className="ag-benefit-icon is-highlight-icon">
                  <IconSprout />
                </div>
                <h3 className="ag-benefit-title is-highlight-title">
                  Agricultura mais inteligente, do campo à decisão.
                </h3>
              </div>
              <span className="ag-benefit-arrow is-highlight-arrow"><IconArrowRight /></span>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════
         7. SEÇÃO DE MÓDULOS TÉCNICOS (GRADE RESPONSIVA COM CARDS COMPACTOS)
         ═════════════════════════════════════════════════════════════════ */}
      <section className="ag-section ag-section-white" id="modulos">
        <div className="ag-container">
          <div className="ag-section-header">
            <span className="ag-section-tag">Disciplinas Integradas</span>
            <h2 className="ag-section-title">
              Soluções completas para cada desafio no campo.
            </h2>
            <p className="ag-section-lead">
              Acesse os módulos técnicos e obtenha diagnósticos, recomendações e orientações baseadas em ciência, dados e experiência prática.
            </p>
          </div>

          <div className="ag-modules-grid">
            {TECHNICAL_MODULES.map((mod) => (
              <div
                key={mod.id}
                className="ag-module-card"
                onClick={() => {
                  if (mod.id === 'pragas') {
                    scrollToSection('diagnostico-exemplo');
                  } else {
                    openModal('signup');
                  }
                }}
              >
                {/* Fotografia Agrícola do Módulo */}
                <div className="ag-module-thumb">
                  <img
                    src={mod.image}
                    alt={mod.title}
                    className="ag-module-thumb-img"
                  />
                  <div className="ag-module-thumb-badge">
                    <IconCamera />
                    <span>{mod.badge}</span>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="ag-module-content">
                  <div>
                    <div className="ag-module-header">
                      <div className="ag-module-icon-wrap">{mod.icon}</div>
                      <h3 className="ag-module-title">{mod.title}</h3>
                    </div>
                    <p className="ag-module-desc">{mod.desc}</p>
                  </div>

                  <div className="ag-module-footer">
                    <span>Acessar módulo</span>
                    <span><IconArrowRight /></span>
                  </div>
                </div>
              </div>
            ))}
          </div>


        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════
         8. PÁGINA / SEÇÃO DE METODOLOGIA (CIÊNCIA E TÉCNICA EM 4 ETAPAS)
         ═════════════════════════════════════════════════════════════════ */}
      <section className="ag-section ag-section-subtle" id="metodologia">
        <div className="ag-container">
          <div className="ag-section-header">
            <span className="ag-section-tag">Critérios Agronômicos</span>
            <h2 className="ag-section-title">
              Ciência, dados e metodologia agronômica.
            </h2>
            <p className="ag-section-lead">
              Conheça os critérios utilizados para interpretar informações, avaliar sintomas e estruturar recomendações técnicas.
            </p>
          </div>

          <div className="ag-method-grid">
            {METHODOLOGY_STEPS.map((step) => (
              <div key={step.num} className="ag-method-step">
                <div className="ag-step-number-wrap">
                  <div className="ag-step-num">{step.num}</div>
                  <div className="ag-step-icon">{step.icon}</div>
                </div>
                <h3 className="ag-step-title">{step.title}</h3>
                <p className="ag-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Banner Fotográfico da Metodologia */}
          <div className="ag-method-banner">
            <img
              src="/images/crop_sunset.jpg"
              alt="Paisagem de lavoura brasileira ao pôr do sol"
              className="ag-method-banner-img"
            />
            <div className="ag-method-banner-overlay">
              <div className="ag-method-banner-text">
                <h3 className="ag-method-banner-title">Rigor científico adaptado à agricultura tropical</h3>
                <p className="ag-method-banner-sub">
                  Diretrizes fundamentadas na literatura agronômica brasileira, biomas nacionais e normativas oficiais de manejo sustentável.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════
         10. RODAPÉ PROFISSIONAL (4 GRUPOS + DIVISÓRIA + COPYRIGHT DINÂMICO)
         ═════════════════════════════════════════════════════════════════ */}
      <footer className="ag-footer">
        <div className="ag-container">
          <div className="ag-footer-grid">
            {/* Grupo 1 — Marca */}
            <div>
              <div className="ag-brand" onClick={() => scrollToSection('inicio')}>
                <AgroBotLogo theme="dark" height={36} />
              </div>
              <p className="ag-footer-brand-desc">
                Tecnologia e ciência a serviço do produtor rural, consultorias e engenheiros agrônomos em todo o território nacional.
              </p>
            </div>

            {/* Grupo 2 — Plataforma */}
            <div>
              <h4 className="ag-footer-col-title">Plataforma</h4>
              <ul className="ag-footer-links">
                <li>
                  <button type="button" className="ag-footer-btn-link" onClick={() => scrollToSection('inicio')}>
                    Início
                  </button>
                </li>
                <li>
                  <button type="button" className="ag-footer-btn-link" onClick={() => scrollToSection('modulos')}>
                    Módulos técnicos
                  </button>
                </li>
                <li>
                  <button type="button" className="ag-footer-btn-link" onClick={() => scrollToSection('metodologia')}>
                    Metodologia
                  </button>
                </li>
              </ul>
            </div>

            {/* Grupo 3 — Recursos */}
            <div>
              <h4 className="ag-footer-col-title">Recursos</h4>
              <ul className="ag-footer-links">
                <li>
                  <button type="button" className="ag-footer-btn-link" onClick={() => openModal('signup')}>
                    Iniciar diagnóstico
                  </button>
                </li>
                <li>
                  <button type="button" className="ag-footer-btn-link" onClick={() => scrollToSection('diagnostico-exemplo')}>
                    Consultar recursos técnicos
                  </button>
                </li>
                <li>
                  <button type="button" className="ag-footer-btn-link" onClick={() => openModal('login')}>
                    Acessar conta
                  </button>
                </li>
              </ul>
            </div>

            {/* Grupo 4 — Informações */}
            <div>
              <h4 className="ag-footer-col-title">Informações</h4>
              <ul className="ag-footer-links">
                <li>
                  <a
                    href="/privacidade"
                    className="ag-footer-btn-link"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/privacidade');
                    }}
                  >
                    Política de Privacidade
                  </a>
                </li>
                <li>
                  <button type="button" className="ag-footer-btn-link" onClick={() => openModal('signup')}>
                    Termos de uso
                  </button>
                </li>
                <li>
                  <span style={{ fontSize: 13, color: '#A9C9BB' }}>
                    Suporte técnico ao produtor
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Linha Divisória e Copyright Atualizado */}
          <div className="ag-footer-bottom">
            <span>
              © {new Date().getFullYear()} AgroBot — Inteligência Agronômica. Todos os direitos reservados.
            </span>
            <span style={{ opacity: 0.8 }}>
              Desenvolvido para apoiar a tomada de decisão no campo brasileiro.
            </span>
          </div>
        </div>
      </footer>

      {/* ═════════════════════════════════════════════════════════════════
         MODAL DE AUTENTICAÇÃO (LOGIN / CADASTRO / GOOGLE / VERIFICAÇÃO)
         ═════════════════════════════════════════════════════════════════ */}
      <div
        className={`agro-modal-backdrop${modalOpen ? ' is-visible' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div className="agro-auth-dialog" onClick={(e) => e.stopPropagation()}>
          <button className="agro-dialog-close" onClick={closeModal} aria-label="Fechar janela">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="agro-dialog-header">
            <div className="agro-dialog-mark" style={{ background: 'transparent', border: 'none', padding: 0 }}>
              <AgroBotLogo theme="light" height={44} showSubtitle={false} />
            </div>
            <h2 className="agro-dialog-title">
              {modalTab === 'login' && 'Acessar o AgroBot'}
              {modalTab === 'signup' && 'Criar sua conta de acesso'}
              {modalTab === 'verify' && 'Verificação de e-mail'}
            </h2>
            <p className="agro-dialog-sub">
              {modalTab === 'login' && 'Entre com seus dados para continuar suas consultas.'}
              {modalTab === 'signup' && 'Comece gratuitamente sem necessidade de cartão.'}
              {modalTab === 'verify' && `Digite o código numérico enviado para ${verifEmail}`}
            </p>
          </div>

          {/* ── ABA LOGIN ── */}
          {modalTab === 'login' && (
            <div className="agro-form-stack">
              <button
                className={`agro-btn-social${googleLoading ? ' is-busy' : ''}`}
                onClick={googleSignIn}
              >
                {!googleLoading && (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span>{googleLoading ? 'Conectando ao Google...' : 'Continuar com conta Google'}</span>
              </button>

              <div className="agro-form-divider">
                <span>ou informe seu e-mail</span>
              </div>

              <div className="agro-field">
                <label className="agro-label">E-mail corporativo ou pessoal</label>
                <input
                  className="agro-input"
                  type="email"
                  placeholder="exemplo@fazenda.com.br"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doLogin()}
                />
              </div>

              <div className="agro-field">
                <label className="agro-label">Senha</label>
                <div className="agro-pass-box">
                  <input
                    className="agro-input"
                    type={loginPassVisible ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && doLogin()}
                  />
                  <button
                    type="button"
                    className="agro-pass-toggle"
                    onClick={() => setLoginPassVisible((v) => !v)}
                    aria-label="Alternar visibilidade da senha"
                  >
                    {loginPassVisible ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              {loginError && <div className="agro-alert error">{loginError}</div>}

              <button className="agro-btn agro-btn-primary agro-btn-block" onClick={doLogin}>
                Entrar no sistema
              </button>

              <p className="agro-dialog-switch">
                Ainda não possui conta?{' '}
                <button type="button" onClick={() => switchTab('signup')}>
                  Criar conta gratuita
                </button>
              </p>
            </div>
          )}

          {/* ── ABA CADASTRO ── */}
          {modalTab === 'signup' && (
            <div className="agro-form-stack">
              <button
                className={`agro-btn-social${googleLoading ? ' is-busy' : ''}`}
                onClick={googleSignIn}
              >
                {!googleLoading && (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span>{googleLoading ? 'Conectando ao Google...' : 'Cadastrar com conta Google'}</span>
              </button>

              <div className="agro-form-divider">
                <span>ou preencha com e-mail</span>
              </div>

              <div className="agro-field">
                <label className="agro-label">Nome completo</label>
                <input
                  className="agro-input"
                  type="text"
                  placeholder="Nome do agrônomo ou produtor"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  maxLength={40}
                />
              </div>

              <div className="agro-field">
                <label className="agro-label">E-mail</label>
                <input
                  className="agro-input"
                  type="email"
                  placeholder="seu.email@dominio.com.br"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>

              <div className="agro-field">
                <label className="agro-label">Senha (mínimo 8 dígitos)</label>
                <div className="agro-pass-box">
                  <input
                    className="agro-input"
                    type={signupPassVisible ? 'text' : 'password'}
                    placeholder="Defina uma senha segura"
                    value={signupPass}
                    onChange={(e) => setSignupPass(e.target.value)}
                  />
                  <button
                    type="button"
                    className="agro-pass-toggle"
                    onClick={() => setSignupPassVisible((v) => !v)}
                    aria-label="Alternar visibilidade da senha"
                  >
                    {signupPassVisible ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              <div className="agro-field">
                <label className="agro-label">Confirmar senha</label>
                <div className="agro-pass-box">
                  <input
                    className="agro-input"
                    type={signupConfirmVisible ? 'text' : 'password'}
                    placeholder="Repita a senha digitada"
                    value={signupPassConfirm}
                    onChange={(e) => setSignupPassConfirm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && doSignup()}
                  />
                  <button
                    type="button"
                    className="agro-pass-toggle"
                    onClick={() => setSignupConfirmVisible((v) => !v)}
                    aria-label="Alternar visibilidade da senha"
                  >
                    {signupConfirmVisible ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              {signupError && <div className="agro-alert error">{signupError}</div>}

              <button className="agro-btn agro-btn-primary agro-btn-block" onClick={doSignup}>
                Concluir cadastro gratuito
              </button>

              <p className="agro-dialog-switch">
                Já é cadastrado?{' '}
                <button type="button" onClick={() => switchTab('login')}>
                  Fazer login
                </button>
              </p>

              <p className="agro-dialog-terms">
                Ao cadastrar, você concorda com nossos termos e com a{' '}
                <a
                  href="/privacidade"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/privacidade');
                  }}
                >
                  Política de Privacidade
                </a>.
              </p>
            </div>
          )}

          {/* ── ABA CONFIRMAR CÓDIGO ── */}
          {modalTab === 'verify' && (
            <div className="agro-form-stack">
              {(resendSuccess || verifSuccessMsg) && (
                <div className="agro-alert success">
                  {resendSuccess || verifSuccessMsg}
                </div>
              )}

              <div className="agro-field">
                <label className="agro-label agro-text-center">Código de validação</label>
                <input
                  className="agro-input agro-input-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  value={verifCode}
                  onChange={(e) =>
                    setVerifCode(e.target.value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase())
                  }
                  onKeyDown={(e) => e.key === 'Enter' && doVerifyCode()}
                  autoFocus
                />
              </div>

              {verifError && <div className="agro-alert error agro-text-center">{verifError}</div>}

              <button
                className="agro-btn agro-btn-primary agro-btn-block"
                onClick={doVerifyCode}
                disabled={verifLoading}
              >
                {verifLoading ? 'Validando...' : 'Confirmar e acessar'}
              </button>

              <div className="agro-text-center" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="agro-link-btn"
                  onClick={!resendLoading ? doResendVerification : undefined}
                  disabled={resendLoading}
                >
                  {resendLoading ? 'Reenviando...' : 'Não recebeu? Reenviar código'}
                </button>
              </div>

              <div className="agro-text-center" style={{ marginTop: 8 }}>
                <button type="button" className="agro-link-btn" onClick={() => switchTab('login')}>
                  Voltar para tela de login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
