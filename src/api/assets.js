import { apiClient } from './client'

export const assetsApi = {
  list: (options) => apiClient.get('/assets', options),
  get: (assetId, options) => apiClient.get(`/assets/${assetId}`, options),
}
