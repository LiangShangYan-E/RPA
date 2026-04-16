import http from './http'

const normalizeExecutionItem = (item = {}) => ({
  execId: item.execId ?? item.executionId ?? item.id ?? item.recordId ?? '',
  taskCode: item.taskCode ?? item.taskId ?? item.taskNo ?? item.code ?? '',
  processCode: item.processCode ?? item.processId ?? item.flowCode ?? item.flowId ?? '',
  robotCode: item.robotCode ?? item.robotId ?? item.clientCode ?? item.clientId ?? '',
  status: item.status ?? item.executionStatus ?? item.taskStatus ?? '',
  startTime: item.startTime ?? item.startedAt ?? item.beginTime ?? item.createTime ?? '',
  endTime: item.endTime ?? item.finishedAt ?? item.completeTime ?? item.updateTime ?? '',
  errorMessage: item.errorMessage ?? item.errorMsg ?? item.remark ?? item.message ?? ''
})

const unwrapExecutionList = (payload) => {
  const data = payload?.data ?? payload
  const rawList =
    data?.list ??
    data?.records ??
    data?.items ??
    data?.rows ??
    (Array.isArray(data) ? data : [])

  return {
    list: Array.isArray(rawList) ? rawList.map(normalizeExecutionItem) : [],
    total: data?.total ?? data?.count ?? data?.totalCount ?? (Array.isArray(rawList) ? rawList.length : 0)
  }
}

export function getTaskList(params) {
  return http.get('/task', { params }).then((r) => r.data ?? r)
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

export function getTaskExecutions(params) {
  return http.get('/task/executions', { params }).then((r) => unwrapExecutionList(r.data ?? r))
}

export function getProcessOptions() {
  return http.get('/task/options/processes').then((r) => r.data ?? r)
}

export function getRobotOptions() {
  return http.get('/task/options/robots').then((r) => r.data ?? r)
}
