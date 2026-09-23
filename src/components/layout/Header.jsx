import { Bell, LogOut, Menu } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { formatRole } from '../../utils/formatters'
import { getRoute } from '../../routes/routeConfig'
import { StatusBadge } from '../common/StatusBadge'

export function Header({ onOpenMenu }) {
  const { session, logout } = useAuth(); const navigate = useNavigate(); const location = useLocation(); const route = getRoute(location.pathname)
  function handleLogout() { logout(); navigate('/login') }
  return <header className="topbar"><button className="icon-button menu-button" onClick={onOpenMenu} aria-label="Open navigation"><Menu size={21} /></button><div className="breadcrumb"><span>RailYukti</span><span>/</span><strong>{route?.title ?? formatRole(session.role)}</strong></div><div className="topbar-actions"><StatusBadge tone="demo">Demo data</StatusBadge><button className="icon-button" aria-label="Notifications"><Bell size={19} /></button><div className="user-chip"><div className="avatar">{session.initials}</div><div className="user-copy"><strong>{session.name}</strong><span>{formatRole(session.role)}</span></div><button className="logout-button" onClick={handleLogout} title="Log out" aria-label="Log out"><LogOut size={15} /></button></div></div></header>
}
