import http from './http'

export function getTaskList(params) {
  return http.get('/task/list', { params }).then((r) => r.data ?? r)
}

export function getTaskDetail(taskId) {
  return http.get(`/task/${taskId}`).then((r) => r.data ?? r)
}

export function getTaskStages(taskId, params) {
  return http.get(`/task/${taskId}/stages`, { params }).then((r) => r.data ?? r)
}

export function createTask(payload) {
  return http.post('/task', payload).then((r) => r.data ?? r)
}

export function updateTask(taskId, payload) {
  return http.put(`/task/${taskId}`, payload).then((r) => r.data ?? r)
}

export function deleteTask(taskId) {
  return http.delete(`/task/${taskId}`).then((r) => r.data ?? r)
}

export function startTask(taskId) {
  return http.post(`/task/${taskId}/start`).then((r) => r.data ?? r)
}

