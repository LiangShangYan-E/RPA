import http from './http'
import { formatLocalDateTime, formatUtcStringToLocal } from '../utils/datetime'

const normalizeExecutionItem = (item = {}) => ({
  execId: item.execId ?? item.executionId ?? item.execution_id ?? item.id ?? item.recordId ?? item.record_id ?? '',
  taskCode: item.taskCode ?? item.task_code ?? item.taskId ?? item.task_id ?? item.taskNo ?? item.task_no ?? item.code ?? '',
  processCode: item.processCode ?? item.process_code ?? item.processId ?? item.process_id ?? item.flowCode ?? item.flowId ?? '',
  robotCode: item.robotCode ?? item.robot_code ?? item.robotId ?? item.robot_id ?? item.clientCode ?? item.clientId ?? '',
  status: item.status ?? item.executionStatus ?? item.taskStatus ?? '',
  startTime: formatUtcStringToLocal(item.lastStartedAt ?? item.last_started_at ?? item.startTime ?? item.start_time ?? item.startedAt ?? item.started_at ?? item.beginTime ?? item.begin_time ?? item.createTime ?? item.create_time ?? ''),
  endTime: formatUtcStringToLocal(item.lastFinishedAt ?? item.last_finished_at ?? item.endTime ?? item.end_time ?? item.finishedAt ?? item.finished_at ?? item.completeTime ?? item.complete_time ?? item.updateTime ?? item.update_time ?? ''),
  errorMessage: item.errorMessage ?? item.error_message ?? item.errorMsg ?? item.error_msg ?? item.failReason ?? item.fail_reason ?? item.remark ?? item.message ?? '',
  durationSec: Number(item.durationSec ?? item.duration_sec ?? item.durationSeconds ?? item.duration_seconds ?? item.costSec ?? item.cost_sec ?? 0) || 0,
  steps: item.steps ?? item.stepLogs ?? item.step_logs ?? item.stages ?? [],
  raw: item
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
