import { X } from 'lucide-react'

export function DetailDrawer({ open, title, children, onClose }) { if (!open) return null; return <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}><aside className="detail-drawer" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><div className="drawer-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close details"><X size={19} /></button></div><div className="drawer-content">{children}</div></aside></div> }
