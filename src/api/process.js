import http from './http'

/**
 * 获取流程分页列表
 * @param {Object} params { page, size, name, code, status }
 */
export function getProcessList(params) {
  return http.get('/process', { params })
}

/**
 * 获取流程详情
 * @param {String|Number} id 
 */
export function getProcessDetail(id) {
  return http.get(`/process/${id}`)
}

/**
 * 新增流程
 * @param {Object} data { processCode, processName, description, status, stepCount }
 */
export function createProcess(data) {
  return http.post('/process', data)
}

/**
 * 修改流程
 * @param {String|Number} id 
 * @param {Object} data { processCode, processName, description, status, stepCount }
 */
export function updateProcess(id, data) {
  return http.put(`/process/${id}`, data)
}

/**
 * 删除流程
 * @param {String|Number} id 
 */
export function deleteProcess(id) {
  return http.delete(`/process/${id}`)
}

export function getProcessDesign(id) {
  return http.get(`/process/${id}/design`)
}

export function saveProcessDesign(id, payload) {
  return http.put(`/process/${id}/design`, payload)
}
