import axios from 'axios'
import { clearAuth, getToken } from '../services/auth'
import mockRequest from './mock'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000
})

const USE_MOCK = false // Set to false when backend is ready

http.interceptors.request.use((config) => {
  if (USE_MOCK) {
    // Intercept and return mock data
    config.adapter = async (cfg) => {
      const res = await mockRequest(cfg.url, cfg.method, cfg.data)
      return {
        ...res,
        config: cfg,
        status: 200,
        statusText: 'OK',
        headers: {},
        request: {}
      }
    }
  }
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
