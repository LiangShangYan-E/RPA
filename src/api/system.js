import http from './http'

function toFormUrlEncoded(payload) {
  const params = new URLSearchParams()
  if (!payload) return params
  Object.entries(payload).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    params.append(k, String(v))
  })
  return params
}

export function getUsers(params) {
  return http.get('/admin/users', { params }).then(r => r.data ?? r)
}

export function createUser(payload) {
  return http.post('/admin/users', payload).then(r => r.data ?? r)
}

export function updateUser(id, payload) {
  return http.put(`/admin/users/${id}`, payload).then(r => r.data ?? r)
}

export function deleteUser(id) {
  return http.delete(`/admin/users/${id}`).then(r => r.data ?? r)
}

export function resetUserPassword(id) {
  return http.post(`/admin/users/${id}/reset-password`).then(r => r.data ?? r)
}

export function toggleUserStatus(id, status) {
  return http.patch(`/admin/users/${id}/status`, { status }).then(r => r.data ?? r)
}

export function getRoles(params) {
  return http.get('/admin/roles', { params }).then(r => r.data ?? r)
}

export function getRoleDetail(id) {
  return http.get(`/admin/roles/${id}`).then(r => r.data ?? r)
}

export function createRole(payload) {
  return http
    .post('/admin/roles', toFormUrlEncoded(payload), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    .then(r => r.data ?? r)
}

export function updateRole(id, payload) {
  return http
    .put(`/admin/roles/${id}`, toFormUrlEncoded(payload), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    .then(r => r.data ?? r)
}

export function deleteRole(id) {
  return http.delete(`/admin/roles/${id}`).then(r => r.data ?? r)
}

export function getRoleResourceIds(id) {
  return http.get(`/admin/roles/${id}/resource-ids`).then(r => r.data ?? r)
}

export function assignRoleResources(id, resourceIds) {
  return http.put(`/admin/roles/${id}/resources`, resourceIds).then(r => r.data ?? r)
}

export function getResources(params) {
  return http.get('/admin/resources', { params }).then(r => r.data ?? r)
}

export function getResourceTree() {
  return http.get('/admin/resources/tree').then(r => r.data ?? r)
}

export function getResourceTypeOptions() {
  return http.get('/admin/resources/type-options').then(r => r.data ?? r)
}

export function getResourceDetail(id) {
  return http.get(`/admin/resources/${id}`).then(r => r.data ?? r)
}

export function createResource(payload) {
  return http.post('/admin/resources', payload).then(r => r.data ?? r)
}

export function updateResource(id, payload) {
  return http.put(`/admin/resources/${id}`, payload).then(r => r.data ?? r)
}

export function deleteResource(id) {
  return http.delete(`/admin/resources/${id}`).then(r => r.data ?? r)
}
