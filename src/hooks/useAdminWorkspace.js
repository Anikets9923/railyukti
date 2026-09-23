import { useEffect, useState } from 'react'
import { adminMockService } from '../services/adminMockService'

export function useAdminWorkspace() { const [state, setState] = useState({ users: [], roles: [], departments: [], sections: [], assets: [], configuration: [], auditLogs: [], health: [], loading: true, error: null, isMock: true }); const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => { let active = true; Promise.all([adminMockService.getUsers(), adminMockService.getRoles(), adminMockService.getDepartments(), adminMockService.getSections(), adminMockService.getAssets(), adminMockService.getConfiguration(), adminMockService.getAuditLogs(), adminMockService.getHealth()]).then(([users, roles, departments, sections, assets, configuration, auditLogs, health]) => { if (active) setState({ users, roles, departments, sections, assets, configuration, auditLogs, health, loading: false, error: null, isMock: true }) }).catch((error) => { if (active) setState((current) => ({ ...current, loading: false, error })) }); return () => { active = false } }, [refreshKey])
  return { ...state, refresh: () => setRefreshKey((key) => key + 1), save: adminMockService.save }
}
