import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Mantém as classes visuais já existentes no CSS do chat
marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    codespan({ text }) {
      return `<code class="agro-code-inline">${escapeHtml(text)}</code>`;
    },
    heading({ tokens, depth }) {
      const level = Math.min(Math.max(depth, 2), 3);
      return `<h${level} class="agro-chat-h${level}">${this.parser.parseInline(tokens)}</h${level}>`;
    },
    listitem(item) {
      return `<li class="agro-chat-li">${this.parser.parse(item.tokens, !!item.loose)}</li>`;
    },
  },
});

/**
 * Converte o Markdown da resposta em HTML válido e seguro.
 * O DOMPurify remove qualquer script/atributo perigoso que viesse no texto.
 * Cifrões não são tocados: "R$ 150" continua "R$ 150".
 */
export function fmtMd(text) {
  if (!text || typeof text !== 'string') return '';
  const normalized = text.replace(/\\times/g, '×').replace(/\\cdot/g, '·');
  return DOMPurify.sanitize(marked.parse(normalized), { USE_PROFILES: { html: true } });
}
