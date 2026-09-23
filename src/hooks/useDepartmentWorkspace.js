import { useEffect, useState } from 'react'
import { assetsApi } from '../api/assets'
import { apiClient } from '../api/client'
import { blocksApi } from '../api/blocks'
import { maintenanceApi } from '../api/maintenance'
import { planningApi } from '../api/planning'
import { departmentMockService } from '../services/departmentMockService'
import { useAuth } from '../auth/useAuth'

function collection(payload) { return Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [] }

export function useDepartmentWorkspace() {
  const { session } = useAuth(); const department = session.department; const [state, setState] = useState({ tasks: [], assets: [], blocks: [], recommendations: [], plan: [], loading: true, error: null, isMock: false }); const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => { let active = true
    async function load() {
      setState((current) => ({ ...current, loading: true, error: null }))
      if (!apiClient.isConfigured) { const [tasks, assets, blocks, recommendations, plan] = await Promise.all([departmentMockService.getTasks(department), departmentMockService.getAssets(department), departmentMockService.getBlocks(department), departmentMockService.getRecommendations(), departmentMockService.getPlan()]); if (active) setState({ tasks, assets, blocks, recommendations, plan, loading: false, error: null, isMock: true }); return }
      try { const [tasksResponse, assetsResponse, blocksResponse, recommendationsResponse, planResponse] = await Promise.all([maintenanceApi.list(), assetsApi.list(), blocksApi.list(), planningApi.recommendations(), planningApi.weekly()]); if (active) setState({ tasks: collection(tasksResponse), assets: collection(assetsResponse), blocks: collection(blocksResponse), recommendations: collection(recommendationsResponse), plan: collection(planResponse), loading: false, error: null, isMock: false }) }
      catch (error) { const [tasks, assets, blocks, recommendations, plan] = await Promise.all([departmentMockService.getTasks(department), departmentMockService.getAssets(department), departmentMockService.getBlocks(department), departmentMockService.getRecommendations(), departmentMockService.getPlan()]); if (active) setState({ tasks, assets, blocks, recommendations, plan, loading: false, error, isMock: true }) }
    }
    load(); return () => { active = false }
  }, [department, refreshKey])
  async function createBlock(payload) { if (!apiClient.isConfigured) return departmentMockService.createBlock(payload); return blocksApi.create(payload) }
  return { ...state, department, refresh: () => setRefreshKey((key) => key + 1), createBlock }
}
