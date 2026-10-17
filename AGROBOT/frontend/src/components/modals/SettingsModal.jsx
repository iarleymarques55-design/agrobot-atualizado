import { useState } from 'react';
import { LENGTH_OPTIONS } from '../../utils/settings';

export default function SettingsModal({ initial, onSave, onClose }) {
  const [draft, setDraft] = useState(initial);

  return (
    <div className="agro-modal-backdrop is-visible" onClick={onClose}>
      <div
        className="agro-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative' }}
      >
        <button
          type="button"
          className="agro-dialog-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="agro-modal-header">
          <div className="agro-modal-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </div>
          <div className="agro-modal-titles">
            <h2 className="agro-modal-title">Configurações do assistente</h2>
            <p className="agro-modal-sub">
              Personalize o idioma e o nível de detalhe das respostas.
            </p>
          </div>
        </div>

        <div className="agro-modal-form">
          <div className="agro-field">
            <label className="agro-label">Extensão das respostas</label>
            <div className="agro-segmented-tabs">
              {LENGTH_OPTIONS.map((opt) => {
                const active = draft.tokens === opt.tokens;
                return (
                  <button
                    key={opt.tokens}
                    type="button"
                    className={`agro-seg-btn${active ? ' is-active' : ''}`}
                    onClick={() => setDraft((s) => ({ ...s, tokens: opt.tokens }))}
                  >
                    {active && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <span className="agro-field-hint">
              Ajusta o nível de explicação das orientações agronômicas.
            </span>
          </div>

          <div className="agro-field">
            <label className="agro-label">Idioma das respostas</label>
            <div className="agro-input-with-icon">
              <svg className="agro-input-prefix-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <select
                className="agro-input agro-modal-select has-prefix"
                value={draft.lang}
                onChange={(e) => setDraft((s) => ({ ...s, lang: e.target.value }))}
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en">Inglês (English)</option>
                <option value="es">Espanhol (Español)</option>
              </select>
              <svg className="agro-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div className="agro-modal-mint-card">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, color: '#165337' }}>
              <circle cx="12" cy="12" r="10" fill="#165337" />
              <line x1="12" y1="16" x2="12" y2="12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="8" r="1.2" fill="#ffffff" />
            </svg>
            <span>As preferências ficam salvas neste navegador e valem nas próximas consultas.</span>
          </div>

          <div className="agro-modal-actions-end">
            <button type="button" className="agro-modal-btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="agro-modal-btn-save" onClick={() => onSave(draft)}>
              Salvar preferências
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
