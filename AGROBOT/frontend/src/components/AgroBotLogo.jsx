import React from 'react';

/**
 * Logotipo AgroBot inspirado na estética clássica da Embrapa:
 * - Tipografia pesada (Black/Heavy), itálica e imponente
 * - Símbolo de semente/folhas curvas com corte diagonal dinâmico
 * - Fundo 100% transparente (sem caixas ou fundos estáticos)
 * - Adaptado às cores agronômicas do AgroBot (tema claro para header e branco puro para footer)
 */
export default function AgroBotLogo({
  theme = 'light', // 'light' | 'dark'
  height = 38,
  showSubtitle = true,
  className = ''
}) {
  const isDark = theme === 'dark';

  // Cores adaptadas à paleta agronômica do site
  const textColor = isDark ? '#FFFFFF' : '#074834';
  const accentColor = isDark ? '#34D399' : '#059669';
  const leafUpper = isDark ? '#6EE7B7' : '#10B981';
  const leafLower = isDark ? '#34D399' : '#047857';
  const subColor = isDark ? '#A7F3D0' : '#065F46';

  return (
    <div
      className={`agrobot-logo-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        userSelect: 'none',
        lineHeight: 1
      }}
    >
      <svg
        viewBox="0 0 310 68"
        style={{
          height: `${height}px`,
          width: 'auto',
          display: 'block',
          overflow: 'visible'
        }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="AgroBot Inteligência Agronômica"
      >
        <defs>
          <linearGradient id={`leafGradUpper-${theme}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={leafUpper} />
            <stop offset="100%" stopColor={leafLower} />
          </linearGradient>
          <linearGradient id={`leafGradLower-${theme}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={leafLower} />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>
        </defs>

        {/* ── Símbolo de Folha/Semente estilizado no formato Embrapa ── */}
        <g transform="translate(142, 4) scale(0.85)">
          {/* Asa/Folha Superior */}
          <path
            d="M 12,34 C 12,18 24,6 40,4 C 47,3 52,6 55,10 C 40,14 26,24 20,38 C 17,37 13,36 12,34 Z"
            fill={`url(#leafGradUpper-${theme})`}
          />
          {/* Asa/Folha Inferior */}
          <path
            d="M 52,22 C 52,38 40,50 24,52 C 17,53 12,50 9,46 C 24,42 38,32 44,18 C 47,19 51,20 52,22 Z"
            fill={`url(#leafGradLower-${theme})`}
          />
        </g>

        {/* ── Tipografia Estilo (Heavy / Black Italic) ── */}
        <text
          x="4"
          y="44"
          fill={textColor}
          style={{
            fontFamily: "'Montserrat', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
            fontSize: '44px',
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: '-0.04em'
          }}
        >
          Agro<tspan fill={accentColor}>Bot</tspan>
        </text>

        {/* ── Subtítulo Integrado ── */}
        {showSubtitle && (
          <text
            x="6"
            y="61"
            fill={subColor}
            style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
              fontSize: '8px',
              fontWeight: 800,
              letterSpacing: '0.24em',
              textTransform: 'uppercase'
            }}
          >
            INTELIGÊNCIA AGRONÔMICA
          </text>
        )}
      </svg>
    </div>
  );
}
