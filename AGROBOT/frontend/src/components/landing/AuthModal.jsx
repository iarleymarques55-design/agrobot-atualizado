import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AgroBotLogo from '../AgroBotLogo';
import { API, errorMessage, postJson, storeSession } from '../../api/client';
import { EyeOff, EyeOpen, GoogleIcon } from './icons';

function PasswordField({ value, onChange, placeholder, onEnter }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="agro-pass-box">
      <input
        className="agro-input"
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onEnter ? (e) => e.key === 'Enter' && onEnter() : undefined}
      />
      <button
        type="button"
        className="agro-pass-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label="Alternar visibilidade da senha"
      >
        {visible ? <EyeOff /> : <EyeOpen />}
      </button>
    </div>
  );
}

function GoogleButton({ loading, onClick, label }) {
  return (
    <button
      type="button"
      className={`agro-btn-social${loading ? ' is-busy' : ''}`}
      onClick={onClick}
      disabled={loading}
    >
      {!loading && <GoogleIcon />}
      <span>{loading ? 'Conectando ao Google...' : label}</span>
    </button>
  );
}

/** Modal de autenticação: login, cadastro, Google e verificação do código por e-mail. */
export default function AuthModal({ open, tab, onTabChange, onClose }) {
  const navigate = useNavigate();

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Signup
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupPassConfirm, setSignupPassConfirm] = useState('');
  const [signupError, setSignupError] = useState('');

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

  function clearMessages() {
    setGoogleLoading(false);
    setLoginError('');
    setSignupError('');
    setVerifError('');
    setVerifSuccessMsg('');
    setResendSuccess('');
  }

  // Limpa as mensagens sempre que o modal é aberto (ajuste de estado durante o render)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) clearMessages();
  }

  function switchTab(next) {
    clearMessages();
    onTabChange(next);
  }

  function close() {
    setGoogleLoading(false);
    onClose();
  }

  function enterChat(token, user) {
    storeSession(token, user);
    navigate('/chat');
  }

  function goToVerify(email, message) {
    setVerifEmail(email);
    setVerifCode('');
    setVerifError('');
    setResendSuccess('');
    setVerifSuccessMsg(message);
    onTabChange('verify');
  }

  async function doLogin() {
    setLoginError('');
    if (!loginEmail || !loginPass) {
      setLoginError('Preencha seu e-mail e senha cadastrados.');
      return;
    }
    try {
      const { ok, data } = await postJson('/api/login', { email: loginEmail, password: loginPass });
      if (!ok) {
        setLoginError(errorMessage(data, 'Credenciais não conferem com nossos registros.'));
        return;
      }
      if (data.requires_verification) {
        goToVerify(data.email || loginEmail, data.message || 'Código enviado para seu e-mail.');
        return;
      }
      enterChat(data.token, data.user);
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
      const { ok, data } = await postJson('/api/register', {
        name: signupName,
        email: signupEmail,
        password: signupPass,
      });
      if (!ok) {
        setSignupError(errorMessage(data, 'Não foi possível efetuar o cadastro.'));
        return;
      }
      goToVerify(data.email || signupEmail, data.message || 'Código enviado para o e-mail informado.');
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
      const { ok, data } = await postJson('/api/verify-email', { email: verifEmail, code: verifCode });
      setVerifLoading(false);
      if (!ok) {
        setVerifError(errorMessage(data, 'Código incorreto ou expirado.'));
        return;
      }
      enterChat(data.token, data.user);
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
      const { ok, data } = await postJson('/api/send-verification', { email: verifEmail });
      setResendLoading(false);
      if (!ok) {
        setVerifError(errorMessage(data, 'Não foi possível reenviar o código agora.'));
        return;
      }
      setResendSuccess(data.message || 'Novo código de verificação enviado.');
    } catch {
      setResendLoading(false);
      setVerifError('Erro na conexão ao reenviar código.');
    }
  }

  async function googleSignIn() {
    const errSetter = tab === 'login' ? setLoginError : setSignupError;
    errSetter('');

    // Busca o client ID se ainda não tiver
    let cid = googleClientId;
    if (!cid) {
      try {
        const r = await fetch(`${API}/api/config`);
        const d = await r.json();
        if (d.googleClientId) {
          cid = d.googleClientId;
          setGoogleClientId(cid);
        }
      } catch {
        // Tratado logo abaixo como "não configurado"
      }
    }

    if (!cid) {
      errSetter('Autenticação Google ainda não configurada no servidor.');
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      errSetter('SDK do Google ainda está carregando. Aguarde e tente novamente.');
      return;
    }

    setGoogleLoading(true);

    // Timeout de segurança — desbloqueia o botão se o popup for fechado ou travar
    const safetyTimer = setTimeout(() => {
      setGoogleLoading(false);
    }, 90000); // 90 segundos

    try {
      // Fluxo "authorization code" em popup: o Google devolve um código que só o backend,
      // com o client_secret do AgroBot, consegue trocar por tokens. Tokens emitidos para
      // outros sites não servem aqui.
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: cid,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: async (codeResp) => {
          clearTimeout(safetyTimer);

          if (codeResp.error || !codeResp.code) {
            setGoogleLoading(false);
            if (codeResp.error !== 'access_denied') {
              errSetter('Login com Google cancelado ou não autorizado.');
            }
            return;
          }

          try {
            const { ok, data } = await postJson('/api/google-auth-code', { code: codeResp.code });
            if (!ok) {
              setGoogleLoading(false);
              errSetter(errorMessage(data, 'Não foi possível autenticar com o Google.'));
              return;
            }
            enterChat(data.token, data.user);
          } catch {
            setGoogleLoading(false);
            errSetter('Erro de conexão com o servidor de autenticação.');
          }
        },
        error_callback: (err) => {
          clearTimeout(safetyTimer);
          setGoogleLoading(false);
          // Se o usuário fechou o popup, não exibe erro invasivo, apenas libera o botão
          if (err?.type && err.type !== 'popup_closed') {
            errSetter('Janela de login fechada ou bloqueada pelo navegador.');
          }
        },
      });

      client.requestCode();
    } catch {
      clearTimeout(safetyTimer);
      setGoogleLoading(false);
      errSetter('Não foi possível iniciar o login com Google.');
    }
  }

  const privacyLink = (e) => {
    e.preventDefault();
    navigate('/privacidade');
  };

  return (
    <div
      className={`agro-modal-backdrop${open ? ' is-visible' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="agro-auth-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="agro-dialog-close" onClick={close} aria-label="Fechar janela">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="agro-dialog-header">
          <div className="agro-dialog-mark" style={{ background: 'transparent', border: 'none', padding: 0 }}>
            <AgroBotLogo theme="light" height={44} showSubtitle={false} />
          </div>
          <h2 className="agro-dialog-title">
            {tab === 'login' && 'Acessar o AgroBot'}
            {tab === 'signup' && 'Criar sua conta de acesso'}
            {tab === 'verify' && 'Verificação de e-mail'}
          </h2>
          <p className="agro-dialog-sub">
            {tab === 'login' && 'Entre com seus dados para continuar suas consultas.'}
            {tab === 'signup' && 'Comece gratuitamente sem necessidade de cartão.'}
            {tab === 'verify' && `Digite o código numérico enviado para ${verifEmail}`}
          </p>
        </div>

        {/* ── ABA LOGIN ── */}
        {tab === 'login' && (
          <div className="agro-form-stack">
            <GoogleButton loading={googleLoading} onClick={googleSignIn} label="Continuar com conta Google" />

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
              <PasswordField value={loginPass} onChange={setLoginPass} placeholder="Sua senha" onEnter={doLogin} />
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
        {tab === 'signup' && (
          <div className="agro-form-stack">
            <GoogleButton loading={googleLoading} onClick={googleSignIn} label="Cadastrar com conta Google" />

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
              <PasswordField value={signupPass} onChange={setSignupPass} placeholder="Defina uma senha segura" />
            </div>

            <div className="agro-field">
              <label className="agro-label">Confirmar senha</label>
              <PasswordField
                value={signupPassConfirm}
                onChange={setSignupPassConfirm}
                placeholder="Repita a senha digitada"
                onEnter={doSignup}
              />
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
              <a href="/privacidade" onClick={privacyLink}>
                Política de Privacidade
              </a>.
            </p>
          </div>
        )}

        {/* ── ABA CONFIRMAR CÓDIGO ── */}
        {tab === 'verify' && (
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
                onChange={(e) => setVerifCode(e.target.value.replace(/[^0-9]/g, ''))}
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
  );
}
