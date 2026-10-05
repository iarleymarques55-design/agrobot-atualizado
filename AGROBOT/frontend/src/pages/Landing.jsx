import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '';

// Ícone do AgroBot (Broto botânico com corte geométrico de precisão)
const AGRO_LOGO_ICON = (
  <svg viewBox="0 0 24 24" fill="none" style={{ width: 20, height: 20 }}>
    <path
      d="M12 21V11"
      stroke="#1F5E39"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
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

const DOMAIN_MODULES = [
  {
    id: 'solo',
    title: 'Fertilidade e química do solo',
    desc: 'Interpretação detalhada de laudos laboratoriais: cálculo de necessidade de calagem (NC), gessagem, saturação por bases (V%) e equilíbrio de cátions (Ca/Mg/K).',
    detail: 'Metodologia SMP · Relação Ca:Mg · Teores de fósforo resina/mehlich',
    badge: 'Química do solo',
  },
  {
    id: 'pragas',
    title: 'Fitossanidade e manejo integrado',
    desc: 'Identificação de patógenos, pragas e doenças foliares com recomendações de rotação de princípios ativos e controle químico, biológico e cultural.',
    detail: 'MIP · Limiares de dano econômico · Fungicidas multissítios',
    badge: 'Fitossanidade',
  },
  {
    id: 'irrigacao',
    title: 'Engenharia hídrica e irrigação',
    desc: 'Dimensionamento de lâmina bruta e líquida, turno de rega e monitoramento da evapotranspiração (ETc) para pivôs, gotejamento e aspersão.',
    detail: 'Balanço hídrico diário · Coeficiente de cultura (Kc) · Umidade do solo',
    badge: 'Manejo hídrico',
  },
  {
    id: 'fertilizacao',
    title: 'Nutrição vegetal e adubação',
    desc: 'Planos nutricionais balanceados para adubação de base, cobertura e fertirrigação, respeitando a marcha de absorção e a produtividade esperada.',
    detail: 'Exportação por tonelada colhida · Adubação foliar · Micronutrientes',
    badge: 'Nutrição vegetal',
  },
  {
    id: 'documentos',
    title: 'Prescrição técnica e receituário',
    desc: 'Estruturação de receituários agronômicos, pareceres técnicos e cronogramas de pulverização prontos para exportação em PDF e Word.',
    detail: 'Formato normatizado · Compatível com emissão de ART · Download direto',
    badge: 'Documentação',
  },
];

const WORKFLOW_STEPS = [
  {
    number: '1',
    title: 'Registro da demanda de campo',
    desc: 'Descreva a ocorrência no talhão, informe os índices da análise de solo ou envie uma foto nítida do tecido vegetal afetado.',
  },
  {
    number: '2',
    title: 'Processamento técnico cruzado',
    desc: 'O sistema correlaciona os sintomas com a literatura agronômica brasileira, guias da Embrapa e bases de produtos homologados no MAPA.',
  },
  {
    number: '3',
    title: 'Parecer com prescrição fundamentada',
    desc: 'Receba o diagnóstico imediato, dosagem recomendada por hectare, volume de calda, estádio de aplicação e medidas preventivas.',
  },
  {
    number: '4',
    title: 'Emissão e exportação do documento',
    desc: 'Exporte o receituário agronômico ou laudo técnico em PDF e Word para anexar ao histórico da fazenda ou encaminhar ao produtor.',
  },
];

const FAQS = [
  {
    q: 'O AgroBot substitui o agrônomo ou responsável técnico?',
    a: 'Não. O AgroBot atua como ferramenta de apoio à decisão técnica agronômica. A responsabilidade técnica, diagnósticos oficiais e emissão formal de Anotação de Responsabilidade Técnica (ART/CREA) continuam sob a prerrogativa do engenheiro agrônomo habilitado.',
  },
  {
    q: 'O sistema é calibrado para quais culturas agrícolas?',
    a: 'O AgroBot foi treinado nas condições tropicais e subtropicais brasileiras, cobrindo soja, milho, algodão, café, cana-de-açúcar, trigo, feijão, citros, hortaliças e pastagens, considerando épocas de safrinha, plantio direto e biomas locais.',
  },
  {
    q: 'Como funciona o envio de fotos para identificação?',
    a: 'Você pode fotografar folhas, colmos, raízes ou áreas do talhão diretamente pelo celular e anexar na conversa. O modelo analisa padrões de lesões, necrose, clorose e características visuais para sugerir hipóteses diagnósticas.',
  },
  {
    q: 'Posso utilizar no celular durante a inspeção de campo?',
    a: 'Sim. A plataforma é totalmente responsiva e funciona em navegadores móveis sem requerer instalação pesada, ideal para consultas rápidas na beira do talhão ou no escritório da fazenda.',
  },
];

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('agro_token')) navigate('/chat');
  }, [navigate]);

  const [openFaq, setOpenFaq] = useState(0);

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

  function scrollToSection(e, id) {
    if (e && e.preventDefault) e.preventDefault();
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
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPass,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setSignupError(data.error || 'Não foi possível concluir o cadastro.');
        return;
      }
      if (data.requires_verification) {
        setVerifEmail(signupEmail);
        setVerifCode('');
        setVerifError('');
        setVerifSuccessMsg(data.message || 'Código de confirmação enviado para seu e-mail.');
        setResendSuccess('');
        setModalTab('verify');
        return;
      }
      if (data.token) {
        sessionStorage.setItem('agro_token', data.token);
        sessionStorage.setItem('agro_user', JSON.stringify(data.user));
        navigate('/chat');
      }
    } catch {
      setSignupError('Erro ao registrar usuário. Tente novamente.');
    }
  }

  async function doVerifyCode() {
    setVerifError('');
    setResendSuccess('');
    const codeClean = verifCode.trim().replace(/\s+/g, '');
    if (!codeClean || codeClean.length !== 6) {
      setVerifError('Insira o código numérico de 6 dígitos.');
      return;
    }
    setVerifLoading(true);
    try {
      const r = await fetch(`${API}/api/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifEmail, code: codeClean }),
      });
      const data = await r.json();
      setVerifLoading(false);
      if (!r.ok) {
        setVerifError(data.error || 'Código incorreto ou tempo limite expirado.');
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

    // Google Identity Services — ID Token verificado pelo backend
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

      {/* ══ HEADER DE NAVEGAÇÃO ══ */}
      <header className="agro-header">
        <div className="agro-header-inner">
          <a className="agro-brand" href="/">
            <div className="agro-brand-mark">{AGRO_LOGO_ICON}</div>
            <div className="agro-brand-text">
              <span className="agro-brand-name">AgroBot</span>
              <span className="agro-brand-sub">Inteligência Agronômica</span>
            </div>
          </a>

          <nav className="agro-nav" aria-label="Navegação principal">
            <a
              href="#modulos"
              className="agro-nav-link"
              onClick={(e) => scrollToSection(e, 'modulos')}
            >
              Módulos técnicos
            </a>
            <a
              href="#metodologia"
              className="agro-nav-link"
              onClick={(e) => scrollToSection(e, 'metodologia')}
            >
              Metodologia
            </a>
            <a
              href="#validacao"
              className="agro-nav-link"
              onClick={(e) => scrollToSection(e, 'validacao')}
            >
              Validação no campo
            </a>
            <a
              href="#duvidas"
              className="agro-nav-link"
              onClick={(e) => scrollToSection(e, 'duvidas')}
            >
              Dúvidas
            </a>
          </nav>

          <div className="agro-header-actions">
            <button
              className="agro-btn agro-btn-ghost"
              onClick={() => openModal('login')}
            >
              Acessar conta
            </button>
            <button
              className="agro-btn agro-btn-primary"
              onClick={() => openModal('signup')}
            >
              Iniciar diagnóstico
            </button>
          </div>
        </div>
      </header>

      {/* ══ HERO SECTION ══ */}
      <section className="agro-hero">
        <div className="agro-hero-container">
          <div className="agro-hero-col-text">
            <div className="agro-status-flag">
              <span className="agro-flag-indicator" />
              <span>Suporte técnico para safra 2026/2027</span>
            </div>

            <h1 className="agro-hero-heading">
              Diagnósticos agronômicos imediatos fundamentados na ciência do campo.
            </h1>

            <p className="agro-hero-summary">
              Da interpretação química de solo ao manejo fitossanitário integrado. O AgroBot traduz dados laboratoriais e fotos de lavoura em prescrições claras, alinhadas à pesquisa tropical brasileira e às normas do MAPA.
            </p>

            <div className="agro-hero-cta-group">
              <button
                className="agro-btn agro-btn-primary agro-btn-lg"
                onClick={() => openModal('signup')}
              >
                Abrir consulta gratuita
              </button>
              <button
                className="agro-btn agro-btn-outline agro-btn-lg"
                onClick={(e) => scrollToSection(e, 'validacao')}
              >
                Ver modelo de receituário
              </button>
            </div>

            <div className="agro-hero-credentials">
              <div className="agro-credential-item">
                <span className="agro-cred-val">Normas MAPA</span>
                <span className="agro-cred-label">Defensivos e dosagens registrados</span>
              </div>
              <div className="agro-credential-divider" />
              <div className="agro-credential-item">
                <span className="agro-cred-val">Calibragem Tropical</span>
                <span className="agro-cred-label">Solos de Cerrado, Sul e Nordeste</span>
              </div>
              <div className="agro-credential-divider" />
              <div className="agro-credential-item">
                <span className="agro-cred-val">Exportação Direta</span>
                <span className="agro-cred-label">Laudos normatizados em PDF e Word</span>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Dossiê Agronômico Interativo */}
          <div className="agro-hero-col-card">
            <div className="agro-dossier-card">
              <div className="agro-dossier-topbar">
                <div className="agro-dossier-id">
                  <span className="agro-dossier-chip">Inspeção Fitossanitária</span>
                  <span className="agro-dossier-talhao">Talhão G-04 · Soja</span>
                </div>
                <span className="agro-dossier-state">Estádio R1 (Florescimento)</span>
              </div>

              {/* Mensagem do Técnico */}
              <div className="agro-dossier-query">
                <div className="agro-dossier-avatar user">T</div>
                <div className="agro-dossier-bubble user">
                  <p>
                    Identifiquei pontuações castanho-escuras no baixeiro de plantas em R1. A desfolha inicial começou no terço inferior. Qual o diagnóstico e conduta?
                  </p>
                  <span className="agro-dossier-time">Consulta registrada hoje às 08:34</span>
                </div>
              </div>

              {/* Resposta Estruturada do AgroBot */}
              <div className="agro-dossier-response">
                <div className="agro-dossier-avatar bot">{AGRO_LOGO_ICON}</div>
                <div className="agro-dossier-bubble bot">
                  <div className="agro-diag-header">
                    <span className="agro-diag-title">Hipótese Principal: Ferrugem Asiática</span>
                    <span className="agro-diag-pathogen">Phakopsora pachyrhizi</span>
                  </div>

                  <div className="agro-metric-strip">
                    <div className="agro-metric">
                      <span className="agro-metric-k">Severidade estimada</span>
                      <span className="agro-metric-v warn">3.8% (Terço inferior)</span>
                    </div>
                    <div className="agro-metric">
                      <span className="agro-metric-k">Urgência de manejo</span>
                      <span className="agro-metric-v alert">Imediata (até 48h)</span>
                    </div>
                    <div className="agro-metric">
                      <span className="agro-metric-k">Alvo regulamentado</span>
                      <span className="agro-metric-v success">Homologado MAPA</span>
                    </div>
                  </div>

                  <div className="agro-diag-recom">
                    <div className="agro-recom-line">
                      <strong>Prescrição de manejo:</strong> Triazol + Estrobirulina associado obrigatoriamente a fungicida protetor multissítio (Mancozeb ou Clorotalonil) para contenção de resistência.
                    </div>
                    <div className="agro-recom-line">
                      <strong>Parâmetro de calda:</strong> Volume mínimo de 120 L/ha com gotas médias para penetração adequada no dossel vegetativo.
                    </div>
                  </div>

                  <div className="agro-dossier-action-row">
                    <button
                      className="agro-doc-pill"
                      onClick={() => openModal('signup')}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      Gerar Receituário Completo em PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="agro-dossier-footer">
                <span>Dados validados conforme recomendações de manejo do Consórcio Antiferrugem</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ MÓDULOS AGRONÔMICOS ══ */}
      <section className="agro-section agro-bg-subtle" id="modulos">
        <div className="agro-container">
          <div className="agro-section-header">
            <span className="agro-section-category">Cobertura técnica</span>
            <h2 className="agro-section-title">
              Disciplinas agronômicas integradas em uma única plataforma
            </h2>
            <p className="agro-section-lead">
              Abordagem holística da lavoura: da estrutura físico-química da terra ao planejamento de colheita.
            </p>
          </div>

          <div className="agro-modules-grid">
            {/* Destaque: Diagnóstico Visual e Fitopatologia */}
            <div className="agro-module-card agro-card-featured">
              <div className="agro-card-top">
                <span className="agro-module-badge">Visão Computacional Aplicada</span>
                <h3 className="agro-card-heading">
                  Inspeção fotográfica de tecidos e sintomas
                </h3>
                <p className="agro-card-text">
                  Fotografe folhas, colmos ou raízes diretamente no campo. O modelo analisa necroses, padrões de halo clorótico e manchas para indicar patógenos prováveis com velocidade de campo.
                </p>
              </div>

              <div className="agro-field-sample-preview">
                <div className="agro-sample-bar">
                  <span className="agro-sample-name">Amostra foliar #109 · Cultura: Soja</span>
                  <span className="agro-sample-confidence">Alta correlação visual</span>
                </div>
                <div className="agro-sample-chips">
                  <div className="agro-sample-chip">
                    <span className="label">Lesão:</span>
                    <span className="val">Pústulas no terço inferior</span>
                  </div>
                  <div className="agro-sample-chip">
                    <span className="label">Condição:</span>
                    <span className="val">Alta umidade relativa (&gt;85%)</span>
                  </div>
                  <div className="agro-sample-chip">
                    <span className="label">Ação indicada:</span>
                    <span className="val highlight">Aplicação preventiva em bloco</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Outros 5 Módulos */}
            {DOMAIN_MODULES.map((item) => (
              <div key={item.id} className="agro-module-card">
                <div className="agro-card-top">
                  <span className="agro-module-badge">{item.badge}</span>
                  <h3 className="agro-card-heading">{item.title}</h3>
                  <p className="agro-card-text">{item.desc}</p>
                </div>
                <div className="agro-module-detail">
                  <span>{item.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ METODOLOGIA DE TRABALHO ══ */}
      <section className="agro-section" id="metodologia">
        <div className="agro-container">
          <div className="agro-section-header">
            <span className="agro-section-category">Fluxo operacional</span>
            <h2 className="agro-section-title">
              Da identificação no campo à emissão do documento técnico
            </h2>
            <p className="agro-section-lead">
              Processo estruturado em quatro etapas para garantir consistência e segurança nas recomendações.
            </p>
          </div>

          <div className="agro-steps-sequence">
            {WORKFLOW_STEPS.map((s) => (
              <div key={s.number} className="agro-step-item">
                <div className="agro-step-digit">{s.number}</div>
                <div className="agro-step-content">
                  <h3 className="agro-step-title">{s.title}</h3>
                  <p className="agro-step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ VALIDAÇÃO NO CAMPO / DOCUMENTO EXEMPLO ══ */}
      <section className="agro-section agro-bg-subtle" id="validacao">
        <div className="agro-container">
          <div className="agro-docket-layout">
            <div className="agro-docket-context">
              <span className="agro-section-category">Segurança técnica</span>
              <h2 className="agro-section-title">
                Documentação clara, objetiva e pronta para uso profissional
              </h2>
              <p className="agro-docket-lead">
                O AgroBot gera relatórios com a terminologia exata exigida pelo setor: ingredientes ativos, grupos químicos, intervalos de segurança e volumes de calda ajustados para cada estádio fenológico.
              </p>
              <div className="agro-checklist">
                <div className="agro-check-row">
                  <span className="agro-check-icon">✓</span>
                  <span>Adequação às diretrizes fitossanitárias brasileiras</span>
                </div>
                <div className="agro-check-row">
                  <span className="agro-check-icon">✓</span>
                  <span>Cálculos automatizados de doses por área e vazão de pontas</span>
                </div>
                <div className="agro-check-row">
                  <span className="agro-check-icon">✓</span>
                  <span>Exportação instantânea para PDF formal e Word editável</span>
                </div>
              </div>
              <button
                className="agro-btn agro-btn-primary agro-btn-lg"
                onClick={() => openModal('signup')}
              >
                Gerar meu primeiro laudo técnico
              </button>
            </div>

            {/* Simulação de Laudo Impresso */}
            <div className="agro-docket-visual">
              <div className="agro-paper-sheet">
                <div className="agro-paper-header">
                  <div>
                    <div className="agro-paper-brand">AGROBOT · LAUDO E PRESCRIÇÃO TÉCNICA</div>
                    <div className="agro-paper-ref">Protocolo: 2026-SP-0914 · Talhão G-04</div>
                  </div>
                  <span className="agro-paper-tag">Documento Técnico</span>
                </div>

                <div className="agro-paper-meta-table">
                  <div className="agro-meta-cell">
                    <span className="label">Cultura</span>
                    <span className="val">Soja (Glycine max)</span>
                  </div>
                  <div className="agro-meta-cell">
                    <span className="label">Área vistoriada</span>
                    <span className="val">180 hectares</span>
                  </div>
                  <div className="agro-meta-cell">
                    <span className="label">Estádio fenológico</span>
                    <span className="val">R1 (Florescimento pleno)</span>
                  </div>
                  <div className="agro-meta-cell">
                    <span className="label">Alvo diagnosticado</span>
                    <span className="val highlight">Phakopsora pachyrhizi</span>
                  </div>
                </div>

                <div className="agro-paper-section">
                  <div className="agro-paper-subheading">Prescrição e Conduta Operacional</div>
                  <div className="agro-paper-instruction">
                    <p><strong>Produto de referência:</strong> Fungicida sistêmico (Triazol + Estrobirulina).</p>
                    <p><strong>Adjuvante multissítio:</strong> Associação com Mancozeb a 1,5 kg/ha para desacelerar pressão de seleção de cepas resistentes.</p>
                    <p><strong>Condições meteorológicas:</strong> Realizar pulverização com ventos entre 3 e 10 km/h, temperatura inferior a 30°C e umidade relativa do ar acima de 55%.</p>
                  </div>
                </div>

                <div className="agro-paper-footer">
                  <span>Gerado via sistema de inteligência agronômica AgroBot</span>
                  <span>Formato A4 para impressão e arquivamento</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ DÚVIDAS FREQUENTES ══ */}
      <section className="agro-section" id="duvidas">
        <div className="agro-container agro-container-narrow">
          <div className="agro-section-header agro-text-center">
            <span className="agro-section-category">Perguntas frequentes</span>
            <h2 className="agro-section-title">
              Esclarecimentos sobre o funcionamento do assistente
            </h2>
            <p className="agro-section-lead">
              Tudo o que você precisa saber sobre suporte técnico, culturas atendidas e precisão das recomendações.
            </p>
          </div>

          <div className="agro-faq-accordion">
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className={`agro-faq-entry${isOpen ? ' is-open' : ''}`}>
                  <button
                    className="agro-faq-toggle"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                  >
                    <span className="agro-faq-q">{item.q}</span>
                    <span className="agro-faq-indicator">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="agro-faq-answer">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ RODAPÉ ══ */}
      <footer className="agro-footer">
        <div className="agro-container">
          <div className="agro-footer-main">
            <div className="agro-footer-identity">
              <a href="/" className="agro-brand">
                <div className="agro-brand-mark">{AGRO_LOGO_ICON}</div>
                <div className="agro-brand-text">
                  <span className="agro-brand-name">AgroBot</span>
                  <span className="agro-brand-sub">Inteligência Agronômica</span>
                </div>
              </a>
              <p className="agro-footer-motto">
                Tecnologia de apoio à decisão agronômica para produtores, consultorias e engenheiros agrônomos em todo o território nacional.
              </p>
            </div>

            <nav className="agro-footer-links" aria-label="Links institucionais">
              <a
                href="#modulos"
                className="agro-footer-link"
                onClick={(e) => scrollToSection(e, 'modulos')}
              >
                Módulos
              </a>
              <a
                href="#metodologia"
                className="agro-footer-link"
                onClick={(e) => scrollToSection(e, 'metodologia')}
              >
                Metodologia
              </a>
              <a
                href="#validacao"
                className="agro-footer-link"
                onClick={(e) => scrollToSection(e, 'validacao')}
              >
                Receituário
              </a>
              <a
                href="#duvidas"
                className="agro-footer-link"
                onClick={(e) => scrollToSection(e, 'duvidas')}
              >
                Dúvidas
              </a>
              <a
                href="/privacidade"
                className="agro-footer-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/privacidade');
                }}
              >
                Política de Privacidade
              </a>
            </nav>
          </div>

          <div className="agro-footer-baseline">
            <div className="agro-footer-copyright">
              © 2026/2027 AgroBot. Desenvolvido para a agricultura brasileira.
            </div>
            <div className="agro-footer-legal">
              As recomendações servem como auxílio à tomada de decisão e não dispensam vistoria presencial.
            </div>
          </div>
        </div>
      </footer>

      {/* ══ MODAL DE AUTENTICAÇÃO ══ */}
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
            <div className="agro-dialog-mark">{AGRO_LOGO_ICON}</div>
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
