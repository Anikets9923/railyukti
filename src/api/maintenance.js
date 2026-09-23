import { apiClient } from './client'

export const maintenanceApi = {
  list: (options) => apiClient.get('/maintenance', options),
  get: (taskId, options) => apiClient.get(`/maintenance/${taskId}`, options),
  create: (payload, options) => apiClient.post('/maintenance', payload, options),
  update: (taskId, payload, options) => apiClient.put(`/maintenance/${taskId}`, payload, options),
}
