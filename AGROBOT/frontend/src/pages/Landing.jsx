import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AgroBotLogo from '../components/AgroBotLogo';
import AuthModal from '../components/landing/AuthModal';
import { METHODOLOGY_STEPS, TECHNICAL_MODULES } from '../components/landing/content';
import {
  IconArrowRight,
  IconCamera,
  IconClose,
  IconDoc,
  IconFlask,
  IconLayers,
  IconMenu,
  IconSprout,
} from '../components/landing/icons';
import { getToken } from '../api/client';

const CURRENT_YEAR = new Date().getFullYear();

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) navigate('/chat');
  }, [navigate]);

  const [activeSection, setActiveSection] = useState('inicio');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('login'); // 'login' | 'signup' | 'verify'

  function openModal(tab) {
    setModalTab(tab);
    setModalOpen(true);
    setMobileMenuOpen(false);
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

  return (
    <div className="agro-app">

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
                    loading="lazy"
                    decoding="async"
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
              src="/images/crop_sunset.webp"
              alt="Paisagem de lavoura brasileira ao pôr do sol"
              className="ag-method-banner-img"
              loading="lazy"
              decoding="async"
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
              © {CURRENT_YEAR} AgroBot — Inteligência Agronômica. Todos os direitos reservados.
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
      <AuthModal
        open={modalOpen}
        tab={modalTab}
        onTabChange={setModalTab}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
