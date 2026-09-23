import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { canAccessRoute, getDashboardPath } from '../routes/routeConfig'

export function ProtectedRoute({ children, routeConfig }) {
  const { isAuthenticated, session } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!canAccessRoute(routeConfig, session)) return <Navigate to={getDashboardPath(session.role)} replace />
  return children
}
