import { apiClient } from './client'

export const trainsApi = {
  list: (options) => apiClient.get('/trains', options),
  timetable: (options) => apiClient.get('/trains/timetable', options),
}
