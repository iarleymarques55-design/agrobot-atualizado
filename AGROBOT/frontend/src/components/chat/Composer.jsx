import { useRef } from 'react';
import { ACCEPTED_IMAGE_TYPES } from '../../utils/images';

export default function Composer({
  textareaRef,
  value,
  onChange,
  onSend,
  canSend,
  pendingFiles,
  onAddFiles,
  onRemoveFile,
}) {
  const fileInputRef = useRef(null);

  function handleInput(e) {
    onChange(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px';
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  function handleFiles(e) {
    onAddFiles(Array.from(e.target.files));
    e.target.value = '';
  }

  return (
    <>
      {/* Pré-visualização de anexos pendentes */}
      {pendingFiles.length > 0 && (
        <div className="agro-pending-bar">
          {pendingFiles.map((f, i) => (
            <div key={i} className="agro-pending-chip">
              <img src={f.data} className="thumb" alt="" />
              <span className="name">{f.name}</span>
              <button className="remove" onClick={() => onRemoveFile(i)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Caixa de Entrada de Texto */}
      <div className="agro-composer-dock">
        <div className="agro-composer-box">
          <button
            className={`agro-btn-attach${pendingFiles.length > 0 ? ' has-files' : ''}`}
            title="Anexar foto do campo (JPEG, PNG ou WebP)"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            multiple
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            onChange={handleFiles}
          />

          <textarea
            ref={textareaRef}
            className="agro-composer-input"
            placeholder="Descreva sua dúvida agronômica..."
            rows={1}
            value={value}
            onKeyDown={handleKey}
            onChange={handleInput}
          />

          <button
            className="agro-btn-send"
            onClick={onSend}
            disabled={!canSend}
            title="Enviar consulta técnica"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22 11 13 2 9l20-7z" />
            </svg>
          </button>
        </div>

        <div className="agro-composer-hint">
          <span className="agro-key-pill">Enter</span> para enviar · <span className="agro-key-pill">Shift + Enter</span> para quebrar linha
        </div>
      </div>
    </>
  );
}
