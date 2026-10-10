import { useNavigate } from 'react-router-dom';
import AgroBotLogo from '../components/AgroBotLogo';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="agro-app agro-privacy-page">
      <header className="agro-header">
        <div className="agro-header-inner">
          <a
            className="agro-brand"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            <AgroBotLogo theme="light" height={36} />
          </a>

          <div className="agro-header-actions">
            <button
              className="agro-btn agro-btn-outline"
              onClick={() => navigate('/')}
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </header>

      <main className="agro-privacy-main">
        <div className="agro-container agro-container-narrow">
          <div className="agro-privacy-head">
            <span className="agro-section-category">Segurança e transparência</span>
            <h1 className="agro-section-title">Política de Privacidade e Proteção de Dados</h1>
            <p className="agro-privacy-date">Vigência: Safra 2026/2027 · Versão 1.2 · Em conformidade com a LGPD</p>
          </div>

          <div className="agro-article-body">
            <section className="agro-article-section">
              <h2>1. Compromisso institucional com os dados do campo</h2>
              <p>
                O <strong>AgroBot</strong> respeita a privacidade de engenheiros agrônomos, consultores técnicos e produtores rurais. Esta Política estabelece como tratamos informações cadastrais, amostras fitossanitárias e parâmetros de solo inseridos em nossa infraestrutura, atendendo rigorosamente à <strong>Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)</strong>.
              </p>
            </section>

            <section className="agro-article-section">
              <h2>2. Informações processadas pela plataforma</h2>
              <p>Para fornecer diagnósticos agronômicos fundamentados e emitir documentação técnica, coletamos:</p>
              <ul>
                <li><strong>Dados de identificação:</strong> Nome profissional, endereço de e-mail e credenciais criptografadas.</li>
                <li><strong>Parâmetros agronômicos do talhão:</strong> Dados físico-químicos (pH, CTC, V%, nutrientes), cultura agrícola, estádio fenológico e localização geográfica aproximada.</li>
                <li><strong>Registros visuais:</strong> Fotografias submetidas para análise de patologia, sintomas de deficiência nutricional ou pragas.</li>
                <li><strong>Histórico de consultas e prescrições:</strong> Interações realizadas para suporte contínuo e consolidação de receituários agronômicos.</li>
              </ul>
            </section>

            <section className="agro-article-section">
              <h2>3. Finalidade do tratamento técnico</h2>
              <p>Os dados coletados destinam-se exclusivamente a:</p>
              <ul>
                <li>Processar consultas e fornecer relatórios técnicos com indicações de manejo embasadas em pesquisa oficial.</li>
                <li>Gerar documentos em formatos PDF e Word sob solicitação do usuário.</li>
                <li>Calibrar a precisão dos modelos preditivos voltados à realidade da agricultura tropical.</li>
                <li>Garantir a segurança operacional e integridade de acesso às contas.</li>
              </ul>
            </section>

            <section className="agro-article-section">
              <h2>4. Sigilo e segurança das informações da fazenda</h2>
              <p>
                Reconhecemos o valor estratégico dos dados de produtividade e manejo de cada propriedade agrícola. O AgroBot emprega criptografia em trânsito (TLS 1.3) e em repouso. Informações individuais de safras e lavouras jamais são comercializadas ou compartilhadas com terceiros sem consentimento explícito.
              </p>
            </section>

            <section className="agro-article-section">
              <h2>5. Direitos do titular</h2>
              <p>
                Em conformidade com o artigo 18 da LGPD, você pode a qualquer momento solicitar a confirmação de tratamento, acesso, correção de dados incompletos ou a exclusão definitiva do seu histórico de consultas e dados cadastrais.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="agro-footer">
        <div className="agro-container">
          <div className="agro-footer-baseline">
            <div className="agro-footer-copyright">
              © 2026 AgroBot. Plataforma de apoio agronômico de precisão.
            </div>
            <div className="agro-footer-legal">
              LGPD e conformidade de dados para o agronegócio brasileiro.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
