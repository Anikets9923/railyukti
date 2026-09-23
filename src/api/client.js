const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
let authToken = null

export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export function setAuthToken(token) {
  authToken = token || null
}

async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  if (!baseUrl) throw new ApiError('API base URL is not configured. Set VITE_API_BASE_URL before connecting to the backend.')
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    signal,
    headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}), ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()
  if (!response.ok) {
    const message = typeof payload === 'object' && payload?.message ? payload.message : `Request failed with status ${response.status}`
    throw new ApiError(message, { status: response.status, details: payload })
  }
  return payload
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  isConfigured: Boolean(baseUrl),
}
