import { useEffect, useState } from 'react'
import { analyticsApi } from '../api/analytics'
import { apiClient } from '../api/client'
import { planningApi } from '../api/planning'
import { divisionalMockService } from '../services/divisionalMockService'

function collection(payload) { return Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [] }

export function useDivisionalWorkspace() {
  const [state, setState] = useState({ summary: {}, departments: [], weekly: [], monthly: [], approvals: [], performance: [], analytics: {}, loading: true, error: null, isMock: false })
  const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => { let active = true
    async function load() {
      setState((current) => ({ ...current, loading: true, error: null }))
      if (!apiClient.isConfigured) { const [summary, departments, weekly, monthly, approvals, performance, analytics] = await Promise.all([divisionalMockService.getSummary(), divisionalMockService.getDepartments(), divisionalMockService.getWeekly(), divisionalMockService.getMonthly(), divisionalMockService.getApprovals(), divisionalMockService.getPerformance(), divisionalMockService.getAnalytics()]); if (active) setState({ summary, departments, weekly, monthly, approvals, performance, analytics, loading: false, error: null, isMock: true }); return }
      try { const [analyticsResponse, weeklyResponse, monthlyResponse, performanceResponse] = await Promise.all([analyticsApi.overview(), planningApi.weekly(), planningApi.monthly(), analyticsApi.performance()]); if (active) setState({ summary: analyticsResponse?.summary ?? analyticsResponse ?? {}, departments: collection(performanceResponse?.departments), weekly: collection(weeklyResponse), monthly: collection(monthlyResponse), approvals: collection(weeklyResponse), performance: collection(performanceResponse), analytics: analyticsResponse?.trends ?? analyticsResponse ?? {}, loading: false, error: null, isMock: false }) }
      catch (error) { if (active) setState((current) => ({ ...current, loading: false, error, isMock: false })) }
    }
    load(); return () => { active = false }
  }, [refreshKey])
  async function actOnPlan(id, action) { if (!apiClient.isConfigured) return divisionalMockService.actOnPlan(id, action); throw new Error('The plan approval action contract is not available in the current frontend API definition.') }
  return { ...state, refresh: () => setRefreshKey((key) => key + 1), actOnPlan }
}
