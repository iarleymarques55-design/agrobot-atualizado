import { DOC_ICON, GearIcon, LEAF_SVG_LIGHT } from './icons';

export default function Sidebar({
  open,
  onToggle,
  onBrandClick,
  historyItems,
  activeId,
  onNewChat,
  onSelect,
  userName,
  userRole,
  userMenuOpen,
  onToggleUserMenu,
  onEditProfile,
  onOpenSettings,
  onLogout,
}) {
  return (
    <aside className={`agro-chat-sidebar${open ? ' is-open' : ''}`}>
      <div className="agro-sidebar-head">
        <div className="agro-brand-wrapper" onClick={onBrandClick}>
          <div className="agro-brand-leaf">{LEAF_SVG_LIGHT}</div>
          <div className="agro-brand-text">
            <span className="agro-brand-title">AgroBot</span>
            <span className="agro-brand-sub">Painel Técnico</span>
          </div>
        </div>
        <button
          className="agro-sidebar-collapse-btn"
          onClick={onToggle}
          title="Recolher menu lateral"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className="agro-sidebar-cta">
        <button className="agro-btn-new-chat" onClick={onNewChat}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nova consulta técnica
        </button>
      </div>

      <div className="agro-sidebar-history">
        <div className="agro-history-heading">Histórico de conversas</div>
        {historyItems.length === 0 ? (
          <div className="agro-history-empty">
            <span>Nenhum atendimento salvo</span>
          </div>
        ) : (
          historyItems.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                className={`agro-history-item${isActive ? ' is-active' : ''}`}
                onClick={() => onSelect(item)}
              >
                {DOC_ICON}
                <div className="agro-history-info">
                  <span className="agro-history-title">{item.title}</span>
                  <span className="agro-history-date">{item.date || 'Recente'}</span>
                </div>
                {isActive && (
                  <svg className="agro-history-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Menu do usuário logado */}
      <div className="agro-sidebar-foot">
        {userMenuOpen && (
          <div className="agro-user-popover">
            <button className="agro-pop-item" onClick={onEditProfile}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar perfil técnico
            </button>
            <button className="agro-pop-item" onClick={onOpenSettings}>
              <GearIcon />
              Configurações da IA
            </button>
            <div className="agro-pop-divider" />
            <button className="agro-pop-item is-danger" onClick={onLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Encerrar sessão
            </button>
          </div>
        )}

        <div className="agro-user-bar" onClick={onToggleUserMenu}>
          <div className="agro-user-avatar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="agro-user-meta">
            <span className="agro-user-name">{userName}</span>
            <span className="agro-user-role">{userRole}</span>
          </div>
          <span className="agro-user-more">•••</span>
        </div>
      </div>
    </aside>
  );
}
