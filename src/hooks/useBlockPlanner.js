import { useEffect, useState } from 'react'
import { apiClient } from '../api/client'
import { blocksApi } from '../api/blocks'
import { maintenanceApi } from '../api/maintenance'
import { planningApi } from '../api/planning'
import { trainsApi } from '../api/trains'
import { blockPlannerMockService } from '../services/blockPlannerMockService'

function collection(payload) { return Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [] }

export function useBlockPlanner() {
  const [state, setState] = useState({ tasks: [], windows: [], trains: [], plan: [], generatedAt: null, explanation: null, loading: true, generating: false, error: null, generationError: null, isMock: false }); const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => { let active = true
    async function load() {
      setState((current) => ({ ...current, loading: true, error: null }))
      if (!apiClient.isConfigured) { const [tasks, windows, trains, plan] = await Promise.all([blockPlannerMockService.getTasks(), blockPlannerMockService.getWindows(), blockPlannerMockService.getTrains(), blockPlannerMockService.getPlan()]); if (active) setState((current) => ({ ...current, tasks, windows, trains, plan, loading: false, error: null, isMock: true })); return }
      try { const [taskResponse, blockResponse, trainResponse, planResponse] = await Promise.all([maintenanceApi.list(), blocksApi.list(), trainsApi.timetable(), planningApi.weekly()]); if (active) setState((current) => ({ ...current, tasks: collection(taskResponse), windows: collection(blockResponse), trains: collection(trainResponse), plan: collection(planResponse), loading: false, error: null, isMock: false })) }
      catch (error) { if (active) setState((current) => ({ ...current, loading: false, error, isMock: false })) }
    }
    load(); return () => { active = false }
  }, [refreshKey])
  async function generate(filters) {
    setState((current) => ({ ...current, generating: true, generationError: null }))
    try { const response = apiClient.isConfigured ? await planningApi.generateOptimizedPlan() : await blockPlannerMockService.generate(filters); const blocks = collection(response?.blocks ?? response); setState((current) => ({ ...current, plan: blocks, generatedAt: response?.generatedAt ?? null, explanation: response?.explanation ?? null, generating: false, generationError: null, isMock: !apiClient.isConfigured })); return response }
    catch (error) { setState((current) => ({ ...current, generating: false, generationError: error })); throw error }
  }
  return { ...state, generate, refresh: () => setRefreshKey((key) => key + 1) }
}
