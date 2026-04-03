const TOKEN_KEY = 'rpa_token'
const USER_KEY = 'rpa_user'

export const USER_CHANGED_EVENT = 'rpa-user-changed'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token, rememberMe) {
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
  if (!token) return
  if (rememberMe) localStorage.setItem(TOKEN_KEY, token)
  else sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setUser(user, rememberMe) {
  sessionStorage.removeItem(USER_KEY)
  localStorage.removeItem(USER_KEY)
  if (!user) return
  const raw = JSON.stringify(user)
  if (rememberMe) localStorage.setItem(USER_KEY, raw)
  else sessionStorage.setItem(USER_KEY, raw)
  window.dispatchEvent(new CustomEvent(USER_CHANGED_EVENT, { detail: user }))
}

export function clearUser() {
  sessionStorage.removeItem(USER_KEY)
  localStorage.removeItem(USER_KEY)
  window.dispatchEvent(new CustomEvent(USER_CHANGED_EVENT, { detail: null }))
}

export function clearAuth() {
  clearToken()
  clearUser()
}

export function isAuthenticated() {
  return Boolean(getToken())
}

export function updateUser(patch) {
  const current = getUser() || {}
  const next = { ...current, ...(patch || {}) }
  const raw = JSON.stringify(next)

  const hasLocal = Boolean(localStorage.getItem(USER_KEY))
  const hasSession = Boolean(sessionStorage.getItem(USER_KEY))

  if (hasLocal) localStorage.setItem(USER_KEY, raw)
  if (hasSession) sessionStorage.setItem(USER_KEY, raw)
  if (!hasLocal && !hasSession) sessionStorage.setItem(USER_KEY, raw)

  window.dispatchEvent(new CustomEvent(USER_CHANGED_EVENT, { detail: next }))
  return next
}
