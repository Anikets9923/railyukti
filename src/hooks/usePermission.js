import { useAuth } from '../auth/AuthContext'
import { hasPermission } from '../auth/permissions'

export function usePermission(permission) {
  const { session } = useAuth()
  return hasPermission(session?.role, permission)
}
