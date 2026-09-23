import { useEffect, useState } from 'react'
import { apiClient } from '../api/client'
import { blocksApi } from '../api/blocks'
import { trainsApi } from '../api/trains'
import { operationsMockService } from '../services/operationsMockService'

function collection(payload) { return Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [] }

export function useOperationsWorkspace() {
  const [state, setState] = useState({ trains: [], blocks: [], corridors: [], conflicts: [], alerts: [], loading: true, error: null, isMock: false }); const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => { let active = true
    async function load() {
      setState((current) => ({ ...current, loading: true, error: null }))
      if (!apiClient.isConfigured) { const [trains, blocks, corridors, conflicts, alerts] = await Promise.all([operationsMockService.getTrains(), operationsMockService.getBlocks(), operationsMockService.getCorridors(), operationsMockService.getConflicts(), operationsMockService.getAlerts()]); if (active) setState({ trains, blocks, corridors, conflicts, alerts, loading: false, error: null, isMock: true }); return }
      try { const [trainResponse, blockResponse] = await Promise.all([trainsApi.timetable(), blocksApi.list()]); if (active) setState({ trains: collection(trainResponse), blocks: collection(blockResponse), corridors: [], conflicts: [], alerts: [], loading: false, error: null, isMock: false }) }
      catch (error) { const [trains, blocks, corridors, conflicts, alerts] = await Promise.all([operationsMockService.getTrains(), operationsMockService.getBlocks(), operationsMockService.getCorridors(), operationsMockService.getConflicts(), operationsMockService.getAlerts()]); if (active) setState({ trains, blocks, corridors, conflicts, alerts, loading: false, error, isMock: true }) }
    }
    load(); return () => { active = false }
  }, [refreshKey])
  return { ...state, refresh: () => setRefreshKey((key) => key + 1) }
}
