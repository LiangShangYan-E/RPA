import http from './http'

export function getRobotList(params) {
  return http.get('/robot/list', { params }).then((r) => r.data ?? r)
}

export function getRobotDetail(id) {
  return http.get(`/robot/${id}`).then((r) => r.data ?? r)
}

export function createRobot(data) {
  return http.post('/robot', data).then((r) => r.data ?? r)
}

export function updateRobot(id, data) {
  return http.put(`/robot/${id}`, data).then((r) => r.data ?? r)
}

export function deleteRobot(id) {
  return http.delete(`/robot/${id}`).then((r) => r.data ?? r)
}
