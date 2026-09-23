import { apiClient } from './client'

export const blocksApi = {
  list: (options) => apiClient.get('/blocks', options),
  create: (payload, options) => apiClient.post('/blocks', payload, options),
  update: (blockId, payload, options) => apiClient.put(`/blocks/${blockId}`, payload, options),
}
