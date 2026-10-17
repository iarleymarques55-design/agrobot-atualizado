import { LEAF_SVG } from './icons';

export default function MessageBubble({ msg, userName, onCopy, onPdf, onWord }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`agro-bubble-row ${msg.role}`}>
      <div className={`agro-bubble-avatar ${msg.role}`}>
        {isUser ? userName.charAt(0).toUpperCase() : (
          <div style={{ width: 22, height: 22 }}>{LEAF_SVG}</div>
        )}
      </div>
      <div className="agro-bubble-content">
        <div className="agro-bubble-sender">
          {isUser ? userName : 'AgroBot'}
        </div>

        {/* msg.html já passou pelo fmtMd (marked + DOMPurify) */}
        <div
          className="agro-bubble-text"
          dangerouslySetInnerHTML={{ __html: msg.html }}
        />

        {msg.files?.length > 0 && (
          <div className="agro-bubble-attachments">
            {msg.files.map((f, i) => (
              <img key={i} src={f.data} className="agro-attach-img" alt={f.name} />
            ))}
          </div>
        )}

        {!isUser && !msg.streaming && !msg.isError && (
          <div className="agro-bubble-toolbar">
            <button className="agro-tool-btn" onClick={() => onCopy(msg.text)}>
              Copiar texto
            </button>
            <button className="agro-tool-btn is-action" onClick={() => onPdf(msg.text)}>
              Gerar Laudo PDF
            </button>
            <button className="agro-tool-btn is-action" onClick={() => onWord(msg.text)}>
              Baixar Word (.doc)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="agro-bubble-row assistant">
      <div className="agro-bubble-avatar assistant">
        <div style={{ width: 22, height: 22 }}>{LEAF_SVG}</div>
      </div>
      <div className="agro-bubble-content">
        <div className="agro-bubble-sender">AgroBot</div>
        <div className="agro-typing-indicator">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </div>
    </div>
  );
}
