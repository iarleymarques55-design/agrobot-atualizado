import { LEAF_SVG } from './icons';

const SUGGESTIONS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#104F38" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
        <line x1="8.5" y1="2" x2="15.5" y2="2" />
        <line x1="7" y1="16" x2="17" y2="16" />
      </svg>
    ),
    title: 'Análise de solo',
    desc: 'Como interpretar o pH, a saturação por bases e a necessidade de calagem?',
    prompt: 'Como interpretar o pH, a saturação por bases e a necessidade de calagem no solo para a cultura da soja?',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#104F38" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
    title: 'Fitossanidade',
    desc: 'Quais informações devo observar ao identificar manchas nas folhas da soja?',
    prompt: 'Quais informações devo observar ao identificar manchas nas folhas da soja?',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#104F38" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
    title: 'Manejo hídrico',
    desc: 'Quais fatores devo considerar para definir o turno de rega?',
    prompt: 'Quais fatores devo considerar para definir o turno de rega?',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#104F38" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 20h10" />
        <path d="M12 20v-8" />
        <path d="M12 12a5 5 0 0 1 5-5h1a6 6 0 0 1-6 6" />
        <path d="M12 12a5 5 0 0 0-5-5H6a6 6 0 0 0 6 6" />
      </svg>
    ),
    title: 'Adubação',
    desc: 'Como interpretar os resultados da análise de solo para planejar a adubação?',
    prompt: 'Como interpretar os resultados da análise de solo para planejar a adubação?',
  },
];

export default function Welcome({ onPickSuggestion }) {
  return (
    <div className="agro-welcome-block">
      <div className="agro-welcome-emblem">
        <div style={{ width: 32, height: 32 }}>{LEAF_SVG}</div>
      </div>
      <h1 className="agro-welcome-title">
        Olá! Como posso ajudar na sua lavoura?
      </h1>
      <p className="agro-welcome-desc">
        Descreva o problema, envie uma foto ou compartilhe os resultados de uma análise para receber orientações agronômicas.
      </p>

      <div className="agro-suggestions-grid">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            className="agro-suggestion-card"
            onClick={() => onPickSuggestion(s.prompt)}
          >
            <div className="agro-card-left">
              <div className="agro-card-icon-box">{s.icon}</div>
              <div className="agro-card-content">
                <span className="agro-card-title">{s.title}</span>
                <span className="agro-card-desc">{s.desc}</span>
              </div>
            </div>
            <svg className="agro-card-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
