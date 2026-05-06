import { ref } from 'vue'
import { getRouters } from '../api/system'

const MENU_KEY = 'rpa_menus'

function loadFromStorage() {
  const raw = localStorage.getItem(MENU_KEY) || sessionStorage.getItem(MENU_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

const menus = ref(loadFromStorage())

export async function fetchMenus(rememberMe) {
  const res = await getRouters()
  const data = res.data || []
  menus.value = data
  const raw = JSON.stringify(data)
  sessionStorage.removeItem(MENU_KEY)
  localStorage.removeItem(MENU_KEY)
  if (rememberMe) localStorage.setItem(MENU_KEY, raw)
  else sessionStorage.setItem(MENU_KEY, raw)
  return data
}

export function useMenus() {
  return menus
}

export function clearMenus() {
  menus.value = []
  sessionStorage.removeItem(MENU_KEY)
  localStorage.removeItem(MENU_KEY)
}
