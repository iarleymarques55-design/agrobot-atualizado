import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Privacy.css';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="agrobot-privacy-wrapper">
      <div className="privacy-layout-container">
        {/* Topo / Logotipo AgroBot */}
        <header className="privacy-header">
          <button
            type="button"
            className="privacy-header-brand"
            onClick={() => navigate('/')}
            title="Voltar ao início"
          >
            <svg
              className="privacy-brand-leaf"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M 27 5 C 17 5 7 11 7 21 C 7 23.5 8.2 25.5 10 26.8 C 6.5 28.5 3 29.5 2 29.8 C 4.5 27 6 23.5 6 19 C 6 10 14 5 27 5 Z"
                fill="#0c3826"
              />
              <path
                d="M 10 26.8 C 11.5 27.5 13.2 27.8 15 27.8 C 22 27.8 28 22 28 15 C 28 11.2 26.5 8 24.2 5.8 C 23.5 13 18 21 10 26.8 Z"
                fill="#0f452f"
              />
            </svg>
            <div className="privacy-brand-text">
              <span className="privacy-brand-name">AgroBot</span>
              <span className="privacy-brand-sub">Assistente Agronômico</span>
            </div>
          </button>
        </header>

        {/* Título e apresentação */}
        <section className="privacy-intro-block">
          <div className="privacy-badge">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#174230"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>Segurança e Transparência</span>
          </div>

          <h1 className="privacy-main-title">
            Política de Privacidade e<br />
            Proteção de Dados
          </h1>

          <p className="privacy-main-description">
            Aqui você encontra informações sobre como seus dados são coletados,<br />
            utilizados e protegidos pelo AgroBot.
          </p>

          <p className="privacy-last-update">
            Última atualização: outubro de 2026
          </p>
        </section>

        {/* Lista de Cards 1 a 5 */}
        <main className="privacy-cards-stack">
          {/* Card 1 */}
          <article className="privacy-card-item">
            <div className="privacy-card-icon-box" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="10" width="14" height="11" rx="2.5" fill="#174834" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#174834" strokeWidth="2.4" strokeLinecap="round" />
                <circle cx="12" cy="15" r="1.5" fill="#dfece3" />
                <path d="M12 16.5V18" stroke="#dfece3" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="privacy-card-content">
              <div className="privacy-card-header">
                <span className="privacy-card-number">1</span>
                <h2 className="privacy-card-title">Compromisso institucional com os dados do campo</h2>
              </div>
              <p className="privacy-card-text">
                O AgroBot respeita a privacidade de engenheiros agrônomos, consultores técnicos e produtores rurais. Esta Política estabelece como tratamos informações cadastrais, amostras fitossanitárias e parâmetros de solo inseridos em nossa infraestrutura, atendendo rigorosamente à Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018).
              </p>
            </div>
          </article>

          {/* Card 2 */}
          <article className="privacy-card-item">
            <div className="privacy-card-icon-box" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 3h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="#174834" />
                <path d="M14 3v5h5" fill="#245a44" opacity="0.6" />
                <line x1="8" y1="12" x2="16" y2="12" stroke="#dfece3" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="8" y1="15.5" x2="16" y2="15.5" stroke="#dfece3" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="8" y1="19" x2="13" y2="19" stroke="#dfece3" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="privacy-card-content">
              <div className="privacy-card-header">
                <span className="privacy-card-number">2</span>
                <h2 className="privacy-card-title">Informações processadas pela plataforma</h2>
              </div>
              <p className="privacy-card-lead">
                Para fornecer diagnósticos agronômicos fundamentados e emitir documentação técnica, coletamos:
              </p>
              <ul className="privacy-card-list">
                <li>
                  <strong>Dados de identificação:</strong> Nome profissional, endereço de e-mail e credenciais criptografadas.
                </li>
                <li>
                  <strong>Parâmetros agronômicos do talhão:</strong> Dados físico-químicos (pH, CTC, V%, nutrientes), cultura agrícola, estádio fenológico e localização geográfica aproximada.
                </li>
                <li>
                  <strong>Registros visuais:</strong> Fotografias submetidas para análise de patologia, sintomas de deficiência nutricional ou pragas.
                </li>
                <li>
                  <strong>Histórico de consultas e prescrições:</strong> Interações realizadas para suporte contínuo e consolidação de receituários agronômicos.
                </li>
              </ul>
            </div>
          </article>

          {/* Card 3 */}
          <article className="privacy-card-item">
            <div className="privacy-card-icon-box" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="#174834" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                <path fillRule="evenodd" clipRule="evenodd" d="M9.4 2.2a2 2 0 0 1 2.2-1.7h.8a2 2 0 0 1 2.2 1.7l.3 1.3a1 1 0 0 0 1 .8h.1a1 1 0 0 0 .9-.5l.8-1a2 2 0 0 1 2.5-.7l.6.3a2 2 0 0 1 1 2.4l-.3 1.3a1 1 0 0 0 .5 1.2l.1.1a1 1 0 0 0 1.2-.1l1.1-.9a2 2 0 0 1 2.6.2l.4.4a2 2 0 0 1 .2 2.6l-.9 1.1a1 1 0 0 0-.1 1.2l.1.1a1 1 0 0 0 1.2.5l1.3-.3a2 2 0 0 1 2.4 1l.3.6a2 2 0 0 1-.7 2.5l-1 .8a1 1 0 0 0-.5.9v.1a1 1 0 0 0 .8 1l1.3.3a2 2 0 0 1 1.7 2.2v.8a2 2 0 0 1-1.7 2.2l-1.3.3a1 1 0 0 0-.8 1v.1a1 1 0 0 0 .5.9l1 .8a2 2 0 0 1 .7 2.5l-.3.6a2 2 0 0 1-2.4 1l-1.3-.3a1 1 0 0 0-1.2.5l-.1.1a1 1 0 0 0 .1 1.2l.9 1.1a2 2 0 0 1-.2 2.6l-.4.4a2 2 0 0 1-2.6.2l-1.1-.9a1 1 0 0 0-1.2-.1l-.1.1a1 1 0 0 0-.5 1.2l.3 1.3a2 2 0 0 1-1 2.4l-.6.3a2 2 0 0 1-2.5-.7l-.8-1a1 1 0 0 0-.9-.5h-.1a1 1 0 0 0-1 .8l-.3 1.3a2 2 0 0 1-2.2 1.7h-.8a2 2 0 0 1-2.2-1.7l-.3-1.3a1 1 0 0 0-1-.8h-.1a1 1 0 0 0-.9.5l-.8 1a2 2 0 0 1-2.5.7l-.6-.3a2 2 0 0 1-1-2.4l.3-1.3a1 1 0 0 0-.5-1.2l-.1-.1a1 1 0 0 0-1.2.1l-1.1.9a2 2 0 0 1-2.6-.2l-.4-.4a2 2 0 0 1-.2-2.6l.9-1.1a1 1 0 0 0 .1-1.2l-.1-.1a1 1 0 0 0-1.2-.5l-1.3.3a2 2 0 0 1-2.4-1l-.3-.6a2 2 0 0 1 .7-2.5l1-.8a1 1 0 0 0 .5-.9v-.1a1 1 0 0 0-.8-1l-1.3-.3a2 2 0 0 1-1.7-2.2v-.8a2 2 0 0 1 1.7-2.2l1.3-.3a1 1 0 0 0 .8-1v-.1a1 1 0 0 0-.5-.9l-1-.8a2 2 0 0 1-.7-2.5l.3-.6a2 2 0 0 1 2.4-1l1.3.3a1 1 0 0 0 1.2-.5l.1-.1a1 1 0 0 0-.1-1.2l-.9-1.1a2 2 0 0 1 .2-2.6l.4-.4a2 2 0 0 1 2.6-.2l1.1.9a1 1 0 0 0 1.2.1l.1-.1a1 1 0 0 0 .5-1.2l-.3-1.3a2 2 0 0 1 1-2.4l.6-.3a2 2 0 0 1 2.5.7l.8 1a1 1 0 0 0 .9.5h.1a1 1 0 0 0 1-.8l.3-1.3z" />
              </svg>
            </div>
            <div className="privacy-card-content">
              <div className="privacy-card-header">
                <span className="privacy-card-number">3</span>
                <h2 className="privacy-card-title">Finalidade do tratamento técnico</h2>
              </div>
              <p className="privacy-card-lead">
                Os dados coletados destinam-se exclusivamente a:
              </p>
              <ul className="privacy-card-list">
                <li>Processar consultas e fornecer relatórios técnicos com indicações de manejo embasadas em pesquisa oficial.</li>
                <li>Gerar documentos em formatos PDF e Word sob solicitação do usuário.</li>
                <li>Calibrar a precisão dos modelos preditivos voltados à realidade da agricultura tropical.</li>
                <li>Garantir a segurança operacional e integridade de acesso às contas.</li>
              </ul>
            </div>
          </article>

          {/* Card 4 */}
          <article className="privacy-card-item">
            <div className="privacy-card-icon-box" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 5.5v6.5c0 5.5 3.5 10 8 11 4.5-1 8-5.5 8-11V5.5L12 2z" fill="#174834" />
                <path d="M9 11.8l2 2 4.2-4.2" stroke="#dfece3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="privacy-card-content">
              <div className="privacy-card-header">
                <span className="privacy-card-number">4</span>
                <h2 className="privacy-card-title">Sigilo e segurança das informações</h2>
              </div>
              <p className="privacy-card-text">
                Reconhecemos o valor estratégico dos dados de produtividade e manejo de cada propriedade agrícola. O AgroBot emprega criptografia em trânsito (TLS 1.3) e em repouso. Informações individuais de safras e lavouras jamais são comercializadas ou compartilhadas com terceiros sem consentimento explícito.
              </p>
            </div>
          </article>

          {/* Card 5 */}
          <article className="privacy-card-item">
            <div className="privacy-card-icon-box" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 3h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="#174834" />
                <path d="M14 3v5h5" fill="#245a44" opacity="0.6" />
                <line x1="8" y1="12" x2="16" y2="12" stroke="#dfece3" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="8" y1="15.5" x2="16" y2="15.5" stroke="#dfece3" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="8" y1="19" x2="13" y2="19" stroke="#dfece3" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="privacy-card-content">
              <div className="privacy-card-header">
                <span className="privacy-card-number">5</span>
                <h2 className="privacy-card-title">Direitos do titular</h2>
              </div>
              <p className="privacy-card-text">
                Em conformidade com o artigo 18 da LGPD, você pode a qualquer momento solicitar a confirmação de tratamento, acesso, correção de dados incompletos ou a exclusão definitiva do seu histórico de consultas e dados cadastrais.
              </p>
            </div>
          </article>
        </main>

        {/* Divisor inferior com folha central */}
        <footer className="privacy-bottom-divider" aria-hidden="true">
          <div className="privacy-divider-line" />
          <div className="privacy-divider-leaf">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 20 4 C 13 4 5 9 5 16 C 5 18 6 19.5 7.5 20.5 C 5 21.8 2 22.5 1 22.8 C 3 20.8 4.2 18 4.2 14.5 C 4.2 7.8 10.5 4 20 4 Z"
                fill="#165b3d"
              />
              <path
                d="M 7.5 20.5 C 8.8 21.2 10.2 21.5 11.8 21.5 C 17 21.5 21.5 17 21.5 11.5 C 21.5 8.5 20.2 6 18.5 4.5 C 18 10 13.8 16 7.5 20.5 Z"
                fill="#1c704c"
              />
            </svg>
          </div>
          <div className="privacy-divider-line" />
        </footer>
      </div>
    </div>
  );
}
