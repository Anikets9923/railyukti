import { useEffect, useState } from 'react'
import { departmentOfficerMockService } from '../services/departmentOfficerMockService'

export function useDepartmentOfficerWorkspace() { const [state, setState] = useState({ requests: [], performance: [], loading: true, error: null, isMock: true }); const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => { let active = true; Promise.all([departmentOfficerMockService.getRequests(), departmentOfficerMockService.getPerformance()]).then(([requests, performance]) => { if (active) setState({ requests, performance, loading: false, error: null, isMock: true }) }).catch((error) => { if (active) setState((current) => ({ ...current, loading: false, error })) }); return () => { active = false } }, [refreshKey])
  return { ...state, refresh: () => setRefreshKey((key) => key + 1), decide: departmentOfficerMockService.decide }
}
