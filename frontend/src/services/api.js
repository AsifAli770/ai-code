import axios from 'axios'
import { tokenStorage } from '../utils/storage'

export const UNAUTHORIZED_EVENT = 'auth:unauthorized'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  // No fixed Content-Type: axios sets JSON for objects and lets the browser set
  // multipart/form-data (with boundary) for FormData uploads.
})

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401 from an authenticated request, drop the token and tell AuthContext.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = Boolean(error.config?.headers?.Authorization)
    if (error.response?.status === 401 && hadToken) {
      tokenStorage.clear()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  },
)

/** Turns any axios error into a readable message + optional field errors. */
export function parseApiError(error) {
  if (error.response) {
    const { message, errors } = error.response.data || {}
    const fieldErrors = {}
    for (const e of errors || []) {
      if (e.field && !fieldErrors[e.field]) fieldErrors[e.field] = e.message
    }
    return { message: message || `Request failed (${error.response.status})`, fieldErrors }
  }
  if (error.request) {
    return { message: 'Cannot reach the server. Is the backend running?', fieldErrors: {} }
  }
  return { message: error.message || 'Something went wrong', fieldErrors: {} }
}

export default api
