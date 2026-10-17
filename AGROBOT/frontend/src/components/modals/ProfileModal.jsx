import { useState } from 'react';

const PROFESSIONS = [
  'Engenheiro Agrônomo',
  'Técnico Agrícola',
  'Estudante de Agronomia',
  'Estudante de Informática',
  'Produtor Rural',
  'Consultor Agrícola',
  'Pesquisador',
  'Outro',
];

export default function ProfileModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial.name || '');
  const [profession, setProfession] = useState(initial.profession || '');
  const [registry, setRegistry] = useState(initial.registry || '');

  return (
    <div className="agro-modal-backdrop is-visible" onClick={onClose}>
      <div className="agro-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="agro-modal-header">
          <div className="agro-modal-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <div className="agro-modal-titles">
            <h2 className="agro-modal-title">Seu perfil profissional</h2>
            <p className="agro-modal-sub">
              Esses dados ajudam a identificar você nos registros e laudos.
            </p>
          </div>
        </div>

        <div className="agro-modal-form">
          <div className="agro-field">
            <label className="agro-label">Nome completo</label>
            <input
              className="agro-input agro-modal-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              maxLength={50}
            />
          </div>

          <div className="agro-field">
            <label className="agro-label">Atuação ou qualificação</label>
            <div className="agro-select-wrapper">
              <select
                className="agro-input agro-modal-select"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
              >
                <option value="">Selecione sua atuação</option>
                {PROFESSIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <svg className="agro-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div className="agro-field">
            <label className="agro-label">
              Registro profissional <span className="agro-label-opt">(opcional)</span>
            </label>
            <input
              className="agro-input agro-modal-input"
              type="text"
              value={registry}
              onChange={(e) => setRegistry(e.target.value)}
              placeholder="CREA, conselho ou registro, se aplicável"
            />
          </div>

          <div className="agro-modal-actions-between">
            <button type="button" className="agro-modal-btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="agro-modal-btn-save"
              onClick={() => onSave({ name, profession, registry })}
            >
              Salvar perfil
            </button>
          </div>

          <div className="agro-modal-footer-note">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Você poderá atualizar essas informações depois.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
