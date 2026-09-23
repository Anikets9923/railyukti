import { useEffect, useState } from 'react'
import { assetsApi } from '../api/assets'
import { apiClient } from '../api/client'
import { maintenanceApi } from '../api/maintenance'
import { fieldMockService } from '../services/fieldMockService'

function collection(payload) { return Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [] }

export function useFieldWorkspace() {
  const [state, setState] = useState({ tasks: [], assets: [], history: [], loading: true, error: null, isMock: false })
  const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => {
    let active = true
    async function load() {
      setState((current) => ({ ...current, loading: true, error: null }))
      if (!apiClient.isConfigured) {
        const [tasks, assets, history] = await Promise.all([fieldMockService.getTasks(), fieldMockService.getAssets(), fieldMockService.getHistory()])
        if (active) setState({ tasks, assets, history, loading: false, error: null, isMock: true })
        return
      }
      try {
        const [taskResponse, assetResponse] = await Promise.all([maintenanceApi.list(), assetsApi.list()])
        const tasks = collection(taskResponse); const assets = collection(assetResponse)
        const history = await fieldMockService.getHistory()
        if (active) setState({ tasks, assets, history, loading: false, error: null, isMock: false })
      } catch (error) {
        const [tasks, assets, history] = await Promise.all([fieldMockService.getTasks(), fieldMockService.getAssets(), fieldMockService.getHistory()])
        if (active) setState({ tasks, assets, history, loading: false, error, isMock: true })
      }
    }
    load()
    return () => { active = false }
  }, [refreshKey])
  return { ...state, refresh: () => setRefreshKey((key) => key + 1), updateTask: (taskId, payload) => maintenanceApi.update(taskId, payload) }
}
