export function StatusBadge({ children, tone = 'neutral', dot = true }) { return <span className={`status-badge status-badge-${tone}`}>{dot && <i />}{children}</span> }
