import { apiClient, ApiError } from './client'

export const planningApi = {
  recommendations: (options) => apiClient.get('/planning/recommendations', options),
  weekly: (options) => apiClient.get('/planning/weekly', options),
  monthly: (options) => apiClient.get('/planning/monthly', options),
  generateOptimizedPlan: () => { throw new ApiError('The AI plan generation endpoint contract is not available in the current frontend API definition.') },
}
