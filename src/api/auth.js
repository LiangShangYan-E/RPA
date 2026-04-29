import http from './http'

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
  const resp = await http.post('/auth/login', payload, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
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
  const resp = await http.post('/auth/logout')
  return resp?.data ?? resp
}

export async function me() {
  const resp = await http.get('/auth/me')
  return resp?.data ?? resp
}

export async function updatePassword(payload) {
  const resp = await http.put('/profile/me/password', payload)
  return resp?.data ?? resp
}

