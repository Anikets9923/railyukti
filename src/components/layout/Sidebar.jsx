import { ChevronDown, TrainFront, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { getNavigation } from './navigation'

export function Sidebar({ session, open, onClose }) {
  const items = getNavigation(session.role)
  return <aside className={`sidebar ${open ? 'is-open' : ''}`}><div className="brand-lockup"><div className="brand-mark"><TrainFront size={22} /></div><div><strong>RailYukti</strong><span>Block planning control</span></div><button className="icon-button sidebar-close" onClick={onClose} aria-label="Close navigation"><X size={18} /></button></div><div className="division-select"><span>{session.department} · DEMO</span><ChevronDown size={14} /></div><nav className="sidebar-nav">{items.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}><Icon size={17} /><span>{label}</span></NavLink>)}</nav><div className="sidebar-footer"><i className="live-dot" /><span>Demo session active</span></div></aside>
}
