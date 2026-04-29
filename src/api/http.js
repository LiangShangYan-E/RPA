import axios from 'axios'
import { clearAuth, getToken } from '../services/auth'

function normalizeApiUrl(url) {
  if (!url || typeof url !== 'string') return url
  if (/^https?:\/\//i.test(url)) return url
  if (!url.startsWith('/')) return url
  if (url.startsWith('/api/')) return url
  return `/api${url}`
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000
})

http.interceptors.request.use((config) => {
  config.url = normalizeApiUrl(config.url)
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
