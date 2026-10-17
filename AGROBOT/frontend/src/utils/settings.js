// Preferências do assistente — ficam no localStorage para sobreviver ao fechamento da aba.
const SETTINGS_KEY = 'agro_settings';

export const DEFAULT_SETTINGS = { tokens: 1200, lang: 'pt-BR' };

export const LENGTH_OPTIONS = [
  { tokens: 600, label: '— Concisa' },
  { tokens: 1200, label: 'Equilibrada' },
  { tokens: 2000, label: '+ Detalhada' },
];

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return {
      tokens: LENGTH_OPTIONS.some((o) => o.tokens === saved.tokens) ? saved.tokens : DEFAULT_SETTINGS.tokens,
      lang: ['pt-BR', 'en', 'es'].includes(saved.lang) ? saved.lang : DEFAULT_SETTINGS.lang,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Armazenamento bloqueado: vale só para esta visita
  }
}
