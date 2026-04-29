import http from './http'

async function requestWithFallback(configs) {
  let lastError
  for (const config of configs) {
    try {
      return await http.request(config)
    } catch (error) {
      lastError = error
      if (error?.response?.status !== 404) {
        throw error
      }
    }
  }
  throw lastError
}

function normalizeUser(user, fallbackUsername) {
  if (!user) return { id: 0, username: fallbackUsername || '', name: '管理员', avatar: '' }
  return {
    ...user,
    id: user.id ?? user.userId ?? 0,
    username: user.username ?? user.userName ?? fallbackUsername ?? '',
    name: user.name ?? user.realName ?? user.username ?? user.userName ?? fallbackUsername ?? '',
    avatar: user.avatar ?? user.headImg ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    role: user.role ?? user.roleName ?? '',
    createTime: user.createTime ?? user.createdAt ?? ''
  }
}

export async function login(payload) {
  const resp = await requestWithFallback([
    {
      url: '/auth/login',
      method: 'post',
      data: payload,
      headers: {
        'Content-Type': 'application/json'
      }
    },
    {
      url: '/api/auth/login',
      method: 'post',
      data: payload,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  ])
  const r = resp?.data ?? resp
  const data = r?.data ?? r
  const token = data?.token ?? r?.token
  const user = data?.user ?? data?.userInfo ?? r?.user ?? r?.userInfo
  const code = r?.code

  if ((code === 0 || code === 200 || code === undefined) && token) {
    return { token, userInfo: normalizeUser(user, payload?.username) }
  }

  throw new Error(r?.message || r?.msg || '登录失败，请检查用户名和密码')
}

export async function logout() {
  const resp = await requestWithFallback([
    { url: '/auth/logout', method: 'post' },
    { url: '/api/auth/logout', method: 'post' }
  ])
  return resp?.data ?? resp
}

export async function me() {
  const resp = await requestWithFallback([
    { url: '/auth/me', method: 'get' },
    { url: '/api/auth/me', method: 'get' }
  ])
  return resp?.data ?? resp
}

export async function updatePassword(payload) {
  const resp = await requestWithFallback([
    { url: '/auth/password', method: 'post', data: payload },
    { url: '/api/auth/password', method: 'post', data: payload }
  ])
  return resp?.data ?? resp
}


