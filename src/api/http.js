import axios from 'axios'
import { clearAuth, getToken } from '../services/auth'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (resp) => resp,
  (err) => {
    if (err?.response?.status === 401) {
      clearAuth()
      if (!window.location.hash.includes('/login')) {
        const redirect = encodeURIComponent(window.location.hash.replace(/^#/, ''))
        window.location.hash = `#/login?redirect=${redirect}`
      }
    }
    return Promise.reject(err)
  }
)

export default http
