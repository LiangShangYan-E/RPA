import http from './http'

const unwrapPayload = (payload) => {
  if (payload?.data !== undefined) return payload.data
  return payload
}

const pickParams = (params = {}) => {
  const {
    page,
    size,
    keyword,
    dataStage,
    taskId,
    executionId,
    dataStatus,
    createdFrom,
    createdTo
  } = params

  return {
    page,
    size,
    keyword,
    dataStage,
    taskId,
    executionId,
    dataStatus,
    createdFrom,
    createdTo
  }
}

const unwrapList = (payload) => {
  const data = unwrapPayload(payload)
  return {
    list: Array.isArray(data?.list) ? data.list : [],
    total: Number(data?.total) || 0
  }
}

const unwrapEntity = (payload) => unwrapPayload(payload)

export function getDataPage(params) {
  return http.get('/data', { params: pickParams(params) }).then((r) => unwrapList(r.data ?? r))
}

export function getDataDetail(id) {
  return http.get(`/data/${id}`).then((r) => unwrapEntity(r.data ?? r))
}

export function createData(data) {
  return http.post('/data', data).then((r) => unwrapEntity(r.data ?? r))
}

export function updateData(id, data) {
  return http.put(`/data/${id}`, data).then((r) => unwrapEntity(r.data ?? r))
}

export function deleteData(id) {
  return http.delete(`/data/${id}`).then((r) => unwrapEntity(r.data ?? r))
}

export function getDataByExecutionId(executionId, params) {
  return http.get(`/data/executions/${executionId}`, { params: pickParams(params) }).then((r) => unwrapList(r.data ?? r))
}
