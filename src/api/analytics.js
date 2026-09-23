import { apiClient } from './client'

export const analyticsApi = {
  overview: (options) => apiClient.get('/analytics/overview', options),
  performance: (options) => apiClient.get('/analytics/performance', options),
}
