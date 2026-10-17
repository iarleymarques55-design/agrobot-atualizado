import { GearIcon } from './icons';

export default function ChatTopbar({ onToggleSidebar, exportOpen, onToggleExport, onExport, onCopyAll, onOpenSettings }) {
  return (
    <header className="agro-chat-topbar">
      <div className="agro-topbar-start">
        <button
          className="agro-toggle-sidebar"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSidebar();
          }}
          title="Alternar menu lateral"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <div className="agro-topbar-session">
          <span className="agro-session-name">AgroBot · Assistente Agronômico</span>
          <span className="agro-session-pill">
            <span className="agro-session-dot" />
            Modo Campo Ativo
          </span>
        </div>
      </div>

      <div className="agro-topbar-end">
        <div className="agro-export-anchor">
          <button
            className="agro-topbar-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExport();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar registro
          </button>
          {exportOpen && (
            <div className="agro-export-menu" onClick={(e) => e.stopPropagation()}>
              <button className="agro-pop-item" onClick={() => onExport('txt')}>
                Baixar relatório (.txt)
              </button>
              <button className="agro-pop-item" onClick={() => onExport('md')}>
                Baixar relatório (.md)
              </button>
              <button className="agro-pop-item" onClick={onCopyAll}>
                Copiar texto integral
              </button>
            </div>
          )}
        </div>

        <button
          className="agro-topbar-icon-btn"
          onClick={onOpenSettings}
          title="Configurações técnicas"
        >
          <GearIcon size={17} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
