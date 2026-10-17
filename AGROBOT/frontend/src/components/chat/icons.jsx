export const LEAF_SVG = (
  <svg viewBox="0 0 24 24" fill="none" style={{ width: '100%', height: '100%' }}>
    <path
      d="M20.24 3.76c-4.5 0-9.5 2-13 6.5-3.5 4.5-3 10-3 10s5.5.5 10-3c4.5-3.5 6.5-8.5 6.5-13-.25-.25-.5-.5-.5-.5z"
      fill="#104F38"
    />
    <path
      d="M4.24 20.24c4.5-4.5 9-7.5 13.5-9"
      stroke="#4ADE80"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const LEAF_SVG_LIGHT = (
  <svg viewBox="0 0 24 24" fill="none" style={{ width: '100%', height: '100%' }}>
    <path
      d="M20.24 3.76c-4.5 0-9.5 2-13 6.5-3.5 4.5-3 10-3 10s5.5.5 10-3c4.5-3.5 6.5-8.5 6.5-13-.25-.25-.5-.5-.5-.5z"
      fill="#4ADE80"
    />
    <path
      d="M4.24 20.24c4.5-4.5 9-7.5 13.5-9"
      stroke="#08281D"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const DOC_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="agro-history-icon">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

export const GearIcon = ({ size = 16, strokeWidth = 2 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} width={size} height={size}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
