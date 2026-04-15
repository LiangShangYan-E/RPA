import { reactive } from 'vue'

const pad2 = (n) => String(n).padStart(2, '0')

const formatDateTime = (d) => {
  const date = d instanceof Date ? d : new Date(d)
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

const genId = (prefix = '') => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

export const rpaStore = reactive({
  seeded: false,
  robots: [],
  flows: [],
  tasks: [],
  executions: [],
  collects: [],
  parses: [],
  processes: [],
  queries: []
})

export const ensureSeeded = () => {
  if (rpaStore.seeded) return
  rpaStore.seeded = true

  rpaStore.robots.push(
    { id: 'A001', code: '机器人001', name: '机器人001', type: '测试机器人', status: 'online', currentTaskId: '空闲', lastHeartbeat: '', updateTime: '2026-03-16T21:12:20' },
    { id: 'ROBOT_001', code: 'ROBOT_001', name: '机器人-001', type: 'thread', status: 'online', currentTaskId: '空闲', lastHeartbeat: '', updateTime: '2026-03-16T21:09:34' },
    { id: 'ROBOT_002', code: 'ROBOT_002', name: '机器人-002', type: 'thread', status: 'offline', currentTaskId: '空闲', lastHeartbeat: '', updateTime: '2026-03-16T21:09:34' }
  )

  rpaStore.flows.push(
    { id: '1', code: '1', name: '1', description: '', steps: 4, status: 'enabled', createTime: '2026-03-20T09:18:12' },
    { id: 'TEST_002', code: '测试流程002', name: '测试流程', description: '', steps: 4, status: 'enabled', createTime: '2026-03-16T21:12:00' },
    { id: 'PROCESS_001', code: 'PROCESS_001', name: '示例流程-仅Java步骤', description: '每一步可绑定 Java/Groovy 爬虫代...', steps: 1, status: 'enabled', createTime: '2026-03-16T21:09:30' }
  )

  const seedTask = ({ code, name, tin, company, processId, robotId, status, createTime }) => ({
    code,
    name,
    tin,
    company,
    processId,
    robotId,
    priority: 5,
    remark: '',
    status,
    createTime
  })

  rpaStore.tasks.push(
    seedTask({
      code: 'TASK_1774405733461',
      name: '示例税务采集任务',
      tin: '91500000MA5U123456',
      company: '重庆某某科技有限公司',
      processId: '1',
      robotId: 'A001',
      status: 'FAILED',
      createTime: '2026-03-25T10:28:50'
    }),
    seedTask({
      code: 'TASK_177433493179',
      name: '示例税务采集任务',
      tin: '91500000MA5U123456',
      company: '重庆某某科技有限公司',
      processId: '1',
      robotId: 'A001',
      status: 'FAILED',
      createTime: '2026-03-25T10:29:04'
    })
  )

  const base = new Date('2026-03-25T10:29:07')
  for (let i = 0; i < 20; i += 1) {
    const t = rpaStore.tasks[i % rpaStore.tasks.length]
    const start = new Date(base.getTime() - i * 60 * 1000)
    const end = new Date(start.getTime() + (2 + (i % 5)) * 1000)
    const status = i % 3 === 0 ? 'SUCCESS' : 'FAILED'
    const exec = createExecution({ taskCode: t.code, processId: t.processId, robotId: t.robotId, status, startTime: formatDateTime(start), endTime: formatDateTime(end) })
    createDataPipeline(exec)
  }
}

export const findTaskByCode = (taskCode) => rpaStore.tasks.find((t) => t.code === taskCode) || null

export const createTask = (payload) => {
  const now = new Date()
  const task = {
    code: payload.code || `TASK_${genId('')}`,
    name: payload.name || '新建任务',
    tin: payload.tin || '',
    company: payload.company || '',
    processId: payload.processId || '',
    robotId: payload.robotId || '',
    priority: payload.priority ?? 5,
    remark: payload.remark || '',
    status: payload.status || 'PENDING',
    createTime: payload.createTime || formatDateTime(now)
  }
  rpaStore.tasks.unshift(task)
  return task
}

export const updateTask = (taskCode, patch) => {
  const t = findTaskByCode(taskCode)
  if (!t) return null
  Object.assign(t, patch)
  return t
}

export const deleteTask = (taskCode) => {
  const idx = rpaStore.tasks.findIndex((t) => t.code === taskCode)
  if (idx >= 0) rpaStore.tasks.splice(idx, 1)
}

export const createExecution = ({ taskCode, processId, robotId, status, startTime, endTime, errorMessage }) => {
  const exec = {
    execId: genId('2036'),
    taskCode,
    processCode: processId || '',
    robotCode: robotId || '',
    status: status || 'RUNNING',
    startTime: startTime || formatDateTime(new Date()),
    endTime: endTime || '',
    errorMessage: errorMessage || (status === 'FAILED' ? '-' : '-')
  }
  rpaStore.executions.unshift(exec)
  return exec
}

export const executeTask = (taskCode, { status = 'SUCCESS', startTime, endTime } = {}) => {
  const t = findTaskByCode(taskCode)
  if (!t) return null
  const start = startTime || formatDateTime(new Date())
  const end = endTime || formatDateTime(new Date(Date.parse(start) + 3000))
  const exec = createExecution({ taskCode: t.code, processId: t.processId, robotId: t.robotId, status, startTime: start, endTime: end })
  updateTask(t.code, { status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED', startTime: start, endTime: end, duration: '3秒' })
  createDataPipeline(exec)
  return exec
}

export const createDataPipeline = (exec) => {
  const task = findTaskByCode(exec.taskCode)
  const collect = {
    collectId: genId('2033'),
    taskCode: exec.taskCode,
    status: exec.status === 'RUNNING' ? 'RUNNING' : exec.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
    tin: task?.tin || '',
    company: task?.company || '',
    source: 'study-spider-demo',
    collectTime: exec.startTime
  }
  rpaStore.collects.unshift(collect)

  const parse = {
    parseId: genId('2033726'),
    taskCode: exec.taskCode,
    collectId: collect.collectId,
    status: exec.status === 'running' ? 'running' : 'success',
    fieldCount: 0,
    ruleApplied: false,
    parseTime: exec.endTime || exec.startTime
  }
  rpaStore.parses.unshift(parse)

  const process = {
    processId: genId('51'),
    taskCode: exec.taskCode,
    parseId: parse.parseId,
    status: exec.status === 'running' ? 'running' : 'success',
    verifyResult: '未通过',
    processTime: exec.endTime || exec.startTime
  }
  rpaStore.processes.unshift(process)

  const query = {
    queryId: genId('56'),
    taskCode: exec.taskCode,
    tin: task?.tin || '',
    company: task?.company || '',
    taxAreaId: '56',
    dataStatus: 'available',
    createTime: exec.endTime || exec.startTime
  }
  rpaStore.queries.unshift(query)

  return { collect, parse, process, query }
}

export const getTaskExecutions = (taskCode) => rpaStore.executions.filter((e) => e.taskCode === taskCode)

