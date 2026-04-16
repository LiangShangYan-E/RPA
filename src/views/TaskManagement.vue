 <template>
  <div class="task-list-view">
    <template v-if="!showDetail">
      <div class="page-title">任务列表</div>
      
      <el-card shadow="never" class="content-card">
        <div class="action-bar">
        <el-button type="primary" @click="openCreateDialog">新建任务</el-button>
        <span class="tip">(创建任务时必须绑定：流程 + 机器人；流程版本可选)</span>
      </div>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="任务编码/名称:">
          <el-input v-model="searchForm.keyword" placeholder="任务编码或名称" clearable />
        </el-form-item>
        <el-form-item label="任务状态:">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 150px">
            <el-option label="待执行" value="PENDING" />
            <el-option label="执行中" value="RUNNING" />
            <el-option label="已完成" value="SUCCESS" />
            <el-option label="失败" value="FAILED" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间:">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="allTasks" stripe class="task-table" v-loading="loading">
        <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" />
        <el-table-column prop="code" label="任务编码" min-width="180">
          <template #default="{ row }">
            <div class="code-cell">
              <el-link type="primary" :underline="false" @click="onViewDetail(row)">{{ row.code }}</el-link>
              <el-icon class="copy-icon" @click="copyText(row.code)"><DocumentCopy /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="任务名称" min-width="150" />
        <el-table-column prop="tin" label="纳税人识别号" min-width="180">
          <template #default="{ row }">
            <div class="code-cell">
              <span>{{ row.tin }}</span>
              <el-icon class="copy-icon" @click="copyText(row.tin)"><DocumentCopy /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="company" label="企业名称" min-width="180" />
        <el-table-column prop="processName" label="流程名称" min-width="160">
          <template #default="{ row }">
            {{ row.processName || getProcessNameById(row.processId) || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="robotName" label="机器人名称" min-width="160">
          <template #default="{ row }">
            {{ row.robotName || getRobotNameById(row.robotId) || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="90" align="center" />
        <el-table-column prop="status" label="任务状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small" effect="light">
              {{ statusLabelMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column prop="endTime" label="结束时间" width="180" />
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="240" fixed="right" class-name="action-column">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link @click="onViewDetail(row)">查看详情</el-button>
              <el-button type="primary" link @click="onEdit(row)">编辑</el-button>
              <el-button type="success" link @click="onExecute(row)">执行</el-button>
              <el-button type="danger" link @click="onDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    </template>

    <template v-else>
      <div class="detail-header">
        <div class="detail-left">
          <el-button @click="showDetail = false">返回</el-button>
          <span class="detail-title">任务详情</span>
        </div>
        <div class="detail-links">
          <el-button type="primary" link @click="goExecutionRecord">执行记录</el-button>
          <el-button type="primary" link @click="goDataCollect">数据采集</el-button>
          <el-button type="primary" link @click="goDataParse">数据解析</el-button>
          <el-button type="primary" link @click="goDataProcess">数据加工</el-button>
          <el-button type="primary" link @click="goDataQuery">数据查询</el-button>
        </div>
      </div>

      <div class="detail-container">
        <div class="detail-card">
          <div class="section-title">基本信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="任务编码" label-class-name="desc-label" class-name="desc-content">
              <div class="code-cell">
                <span>{{ currentDetail.code }}</span>
                <el-icon class="copy-icon" @click="copyText(currentDetail.code)"><DocumentCopy /></el-icon>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="任务名称" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.name }}</el-descriptions-item>
            <el-descriptions-item label="纳税人识别号" label-class-name="desc-label" class-name="desc-content">
              <div class="code-cell">
                <span>{{ currentDetail.tin }}</span>
                <el-icon class="copy-icon" @click="copyText(currentDetail.tin)"><DocumentCopy /></el-icon>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="企业名称" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.company }}</el-descriptions-item>
            <el-descriptions-item label="流程编码" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.processId }}</el-descriptions-item>
            <el-descriptions-item label="流程名称" label-class-name="desc-label" class-name="desc-content">
              {{ currentDetail.processName || getProcessNameById(currentDetail.processId) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="机器人编码" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.robotId }}</el-descriptions-item>
            <el-descriptions-item label="机器人名称" label-class-name="desc-label" class-name="desc-content">
              {{ currentDetail.robotName || getRobotNameById(currentDetail.robotId) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="优先级" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.priority }}</el-descriptions-item>
            <el-descriptions-item label="备注" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.remark || '-' }}</el-descriptions-item>
            <el-descriptions-item label="任务状态" label-class-name="desc-label" class-name="desc-content">
              <el-tag :type="statusTypeMap[currentDetail.status]" size="small" effect="light">
                {{ statusLabelMap[currentDetail.status] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.createTime }}</el-descriptions-item>
            <el-descriptions-item label="开始时间" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.startTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="完成时间" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.endTime || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-card" style="margin-top: 16px;">
          <div class="section-title">执行记录</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="开始时间" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.startTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="完成时间" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.endTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="执行时长" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.duration }}</el-descriptions-item>
            <el-descriptions-item label="错误信息" label-class-name="desc-label" class-name="desc-content">
              <span :class="{ 'error-text': currentDetail.status === 'error' }">
                {{ currentDetail.errorMessage }}
              </span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </template>

    <el-dialog
      v-model="createDialogVisible"
      title="新建任务"
      width="880px"
      class="create-task-dialog"
      :close-on-click-modal="false"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="110px"
        class="create-task-form"
      >
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="createForm.name" />
        </el-form-item>
        <el-form-item label="绑定流程" prop="processId" required>
          <el-select v-model="createForm.processId" placeholder="请选择" style="width: 100%">
            <el-option v-for="p in processOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="绑定机器人" prop="robotId" required>
          <el-select v-model="createForm.robotId" placeholder="请选择" style="width: 100%">
            <el-option v-for="r in robotOptions" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="纳税人识别号" prop="tin">
          <el-input v-model="createForm.tin" />
        </el-form-item>
        <el-form-item label="企业名称" prop="company">
          <el-input v-model="createForm.company" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="createForm.priority" :min="0" :controls="true" class="priority-number" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="createForm.remark" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate(false)">创建</el-button>
        <el-button type="success" @click="submitCreate(true)">创建并执行</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="editDialogVisible"
      title="编辑任务"
      width="880px"
      class="create-task-dialog"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="createRules"
        label-width="110px"
        class="create-task-form"
      >
        <el-form-item label="任务编码" prop="code">
          <el-input v-model="editForm.code" disabled class="disabled-code-input" />
        </el-form-item>
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="绑定流程" prop="processId" required>
          <el-select v-model="editForm.processId" placeholder="请选择" style="width: 100%">
            <el-option v-for="p in processOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="绑定机器人" prop="robotId" required>
          <el-select v-model="editForm.robotId" placeholder="请选择" style="width: 100%">
            <el-option v-for="r in robotOptions" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="纳税人识别号" prop="tin">
          <el-input v-model="editForm.tin" />
        </el-form-item>
        <el-form-item label="企业名称" prop="company">
          <el-input v-model="editForm.company" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="editForm.priority" :min="0" :controls="true" class="priority-number" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="editForm.remark" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DocumentCopy } from '@element-plus/icons-vue'
import { copyToClipboard } from '../utils/clipboard'
import { dispatchRobot } from '../api/robot'
import { createTask, deleteTask, getProcessOptions, getRobotOptions, getTaskDetail, getTaskExecutions, getTaskList, updateTask } from '../api/task'
import { formatLocalDateTime, formatUtcStringToLocal } from '../utils/datetime'

const route = useRoute()
const router = useRouter()

const searchForm = reactive({
  keyword: '',
  status: '',
  timeRange: []
})

const appliedSearch = reactive({
  keyword: '',
  status: '',
  timeRange: []
})

const allTasks = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const processList = ref([])
const robotList = ref([])
const loading = ref(false)
const total = ref(0)

const statusTypeMap = {
  running: 'warning',
  RUNNING: 'warning',
  completed: 'success',
  SUCCESS: 'success',
  idle: 'info',
  PENDING: 'info',
  error: 'danger',
  FAILED: 'danger'
}

const statusLabelMap = {
  running: '执行中',
  RUNNING: '执行中',
  completed: '已完成',
  SUCCESS: '已完成',
  idle: '待执行',
  PENDING: '待执行',
  error: '失败',
  FAILED: '失败'
}

const parseDateTime = (val) => {
  if (!val) return null
  if (val instanceof Date) return val
  const s = String(val).trim()
  if (!s) return null
  const normalized = s.includes(' ') ? s.replace(' ', 'T') : s
  const t = Date.parse(normalized)
  if (Number.isNaN(t)) return null
  return new Date(t)
}

const indexMethod = (index) => (currentPage.value - 1) * pageSize.value + index + 1

const unwrapPayload = (payload) => {
  const data = payload?.data ?? payload
  if (Array.isArray(data)) return { list: data, total: data.length }
  if (!data || typeof data !== 'object') return { list: [], total: 0 }
  const list = data.list ?? data.records ?? data.rows ?? data.items ?? data.data ?? []
  return {
    list: Array.isArray(list) ? list : [],
    total: data.total ?? data.count ?? data.totalCount ?? (Array.isArray(list) ? list.length : 0)
  }
}

const normalizeTask = (t = {}) => ({
  id: t.id ?? t.taskId ?? '',
  code: t.taskCode ?? t.code ?? (t.id ? `TASK_${t.id}` : ''),
  name: t.taskName ?? t.name ?? '',
  tin: t.taxpayerIdNumber ?? t.tin ?? '',
  company: t.companyName ?? t.company ?? '',
  processId: t.processId ?? '',
  processName: t.processName ?? t.flowName ?? '',
  robotId: t.robotId ?? t.robotCode ?? t.clientId ?? '',
  robotName: t.robotName ?? '',
  priority: t.priority ?? 5,
  remark: t.remark ?? '',
  status: t.status ?? 'PENDING',
  createTime: formatLocalDateTime(t.createTime ?? t.create_time ?? t.createdAt ?? t.created_at ?? ''),
  startTime: formatUtcStringToLocal(t.lastStartedAt ?? t.last_started_at ?? t.startTime ?? t.start_time ?? t.startedAt ?? t.started_at ?? t.beginTime ?? t.begin_time ?? ''),
  endTime: formatUtcStringToLocal(t.lastFinishedAt ?? t.last_finished_at ?? t.endTime ?? t.end_time ?? t.finishedAt ?? t.finished_at ?? t.completeTime ?? t.complete_time ?? ''),
  duration: t.duration ?? '',
  resultData: t.resultData ?? '',
  errorMessage: t.errorMessage ?? t.errorMsg ?? ''
})

const toComparable = (val) => (val == null ? '' : String(val).trim())

const getExecutionTimeValue = (exec) => {
  const end = parseDateTime(exec?.endTime)?.getTime()
  if (end) return end
  const start = parseDateTime(exec?.startTime)?.getTime()
  if (start) return start
  return 0
}

const isExecutionBelongsTask = (task, exec) => {
  const taskId = toComparable(task?.id)
  const taskCode = toComparable(task?.code)
  const execTask = toComparable(exec?.taskCode)
  if (!execTask) return false
  // 后端可能把 execution.taskCode 存成任务编码，也可能存成任务ID
  return (taskCode && execTask === taskCode) || (taskId && execTask === taskId)
}

const pickLatestExecutionForTask = (task, executionList = []) => {
  if (!task || !Array.isArray(executionList) || executionList.length === 0) return null
  const matched = executionList.filter((exec) => isExecutionBelongsTask(task, exec))
  if (matched.length === 0) return null
  matched.sort((a, b) => getExecutionTimeValue(b) - getExecutionTimeValue(a))
  return matched[0]
}

const mergeLatestExecutionTime = (task, executionList = []) => {
  if (!task?.id && !task?.code) return task
  const latest = pickLatestExecutionForTask(task, executionList)
  if (!latest) return task
  return {
    ...task,
    startTime: latest.startTime || task.startTime || '',
    endTime: latest.endTime || task.endTime || '',
    errorMessage: latest.errorMessage || task.errorMessage || ''
  }
}

const fetchExecutionsForMerge = async () => {
  try {
    const execRes = await getTaskExecutions({
      page: 1,
      size: 500
    })
    return Array.isArray(execRes?.list) ? execRes.list : []
  } catch {
    return []
  }
}

const fetchExecutionsByTask = async (task) => {
  if (!task) return []
  const params = {
    page: 1,
    size: 50
  }
  if (task.id) params.taskId = task.id
  if (task.code) params.taskCode = task.code
  if (!params.taskId && !params.taskCode) return []
  try {
    const execRes = await getTaskExecutions(params)
    return Array.isArray(execRes?.list) ? execRes.list : []
  } catch {
    return []
  }
}

const enrichTaskWithExecutionTime = async (task, executionList = []) => {
  if (!task) return task
  const merged = mergeLatestExecutionTime(task, executionList)
  if (merged?.startTime || merged?.endTime) return merged
  const taskExecList = await fetchExecutionsByTask(task)
  return mergeLatestExecutionTime(merged, taskExecList)
}

const loadTasks = async () => {
  loading.value = true
  try {
    // 构建 API 参数
    const params = {
      page: currentPage.value,
      size: pageSize.value
    }

    // 添加搜索条件
    if (appliedSearch.keyword) {
      params.keyword = appliedSearch.keyword
    }
    if (appliedSearch.status) {
      params.status = appliedSearch.status
    }
    if (Array.isArray(appliedSearch.timeRange) && appliedSearch.timeRange.length === 2) {
      const [start, end] = appliedSearch.timeRange
      if (start) params.startedFrom = parseDateTime(start)?.toISOString()
      if (end) params.startedTo = parseDateTime(end)?.toISOString()
    }

    const response = await getTaskList(params)
    const { list, total: totalCount } = unwrapPayload(response)
    const normalizedList = list.map(normalizeTask)
    const executionList = await fetchExecutionsForMerge()
    allTasks.value = await Promise.all(
      normalizedList.map((task) => enrichTaskWithExecutionTime(task, executionList))
    )
    total.value = totalCount
  } catch (error) {
    console.error('加载任务列表失败:', error)
    allTasks.value = []
    total.value = 0
    ElMessage.error('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  appliedSearch.keyword = searchForm.keyword
  appliedSearch.status = searchForm.status
  appliedSearch.timeRange = Array.isArray(searchForm.timeRange) ? [...searchForm.timeRange] : []
  currentPage.value = 1
  loadTasks()
}

const onReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.timeRange = []

  appliedSearch.keyword = ''
  appliedSearch.status = ''
  appliedSearch.timeRange = []

  currentPage.value = 1
  loadTasks()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  loadTasks()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadTasks()
}

const copyText = async (text) => {
  const v = text == null ? '' : String(text)
  if (!v) return
  const ok = await copyToClipboard(v)
  if (ok) ElMessage.success('已复制')
  else ElMessage.error('复制失败')
}

const showDetail = ref(false)
const currentDetail = ref({})

const onViewDetail = (row) => {
  if (!row) return
  currentDetail.value = { ...row }
  showDetail.value = true
  const loadDetail = row.id
    ? getTaskDetail(row.id)
        .then((res) => {
          const detailRaw = res?.data ?? res
          currentDetail.value = normalizeTask({ ...row, ...detailRaw })
        })
        .catch(() => {
          ElMessage.warning('任务详情加载失败，当前显示列表快照')
        })
    : Promise.resolve()

  loadDetail.finally(async () => {
    try {
      const executionList = await fetchExecutionsForMerge()
      const merged = mergeLatestExecutionTime(currentDetail.value, executionList)
      currentDetail.value = await enrichTaskWithExecutionTime(merged, executionList)
    } catch {
      // 忽略执行记录回填失败，保留已有详情数据
    }
  })
}

const getCurrentTaskCode = () => (currentDetail.value && currentDetail.value.code ? currentDetail.value.code : '')

const goExecutionRecord = () => {
  const taskCode = getCurrentTaskCode()
  if (!taskCode) return
  router.push({ path: '/task/record', query: { taskCode } })
}

const goDataCollect = () => {
  const taskCode = getCurrentTaskCode()
  if (!taskCode) return
  router.push({ path: '/data/collect', query: { taskCode } })
}

const goDataParse = () => {
  const taskCode = getCurrentTaskCode()
  if (!taskCode) return
  router.push({ path: '/data/parse', query: { taskCode } })
}

const goDataProcess = () => {
  const taskCode = getCurrentTaskCode()
  if (!taskCode) return
  router.push({ path: '/data/process', query: { taskCode } })
}

const goDataQuery = () => {
  const taskCode = getCurrentTaskCode()
  if (!taskCode) return
  router.push({ path: '/data/query', query: { taskCode } })
}

const openDetailByCode = (taskCode) => {
  const t = allTasks.value.find((item) => item.code === taskCode)
  if (!t) return
  onViewDetail(t)
}

watch(
  () => route.query.taskCode,
  (val) => {
    if (typeof val === 'string' && val) openDetailByCode(val)
  },
  { immediate: true }
)

const onEdit = (row) => {
  editForm.code = row.code || ''
  editForm.id = row.id || ''
  editForm.name = row.name || ''
  editForm.processId = row.processId || ''
  editForm.robotId = row.robotId || ''
  editForm.tin = row.tin || ''
  editForm.company = row.company || ''
  editForm.priority = row.priority ?? 5
  editForm.remark = row.remark || ''
  
  editFormRef.value?.clearValidate?.()
  editDialogVisible.value = true
}

const onExecute = async (row) => {
  if (!row) return
  if (row.status === 'RUNNING') {
    ElMessage.info('任务正在执行中')
    return
  }
  try {
    let taskId = row.id
    let robotId = row.robotId

    // 优先用详情接口回填真实执行参数，避免列表字段不完整导致 dispatch 失败
    if ((!taskId || !robotId) && row.id) {
      const detailRes = await getTaskDetail(row.id)
      const detail = normalizeTask(detailRes?.data ?? detailRes)
      taskId = taskId || detail.id
      robotId = robotId || detail.robotId
    }

    if (!taskId || !robotId) {
      ElMessage.warning('任务缺少任务ID或机器人ID，无法执行')
      return
    }

    await dispatchRobot(robotId, taskId)
    ElMessage.success('任务已提交，执行中...')

    // 下发成功后轮询任务详情，等待后端异步执行完成并落库执行时间
    await waitTaskExecutionFinished(taskId)
    await loadTasks()
  } catch (error) {
    console.error('下发执行失败:', error)
    const backendMsg = error?.response?.data?.message || error?.response?.data?.msg || error?.response?.data?.error
    ElMessage.error(backendMsg || error?.message || '下发执行失败')
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const waitTaskExecutionFinished = async (taskId) => {
  if (!taskId) return
  const maxRetry = 30
  const intervalMs = 2000

  for (let i = 0; i < maxRetry; i += 1) {
    try {
      const detailRes = await getTaskDetail(taskId)
      const detail = normalizeTask(detailRes?.data ?? detailRes)
      const finished = detail.status === 'SUCCESS' || detail.status === 'FAILED'
      const hasExecutionTime = !!(detail.startTime || detail.endTime)
      if (finished || hasExecutionTime) {
        return
      }
    } catch {
      // 查询失败不中断主流程，继续重试
    }
    await wait(intervalMs)
  }
}

const onDelete = async (row) => {
  if (!row) return
  try {
    await ElMessageBox.confirm('确定要删除该任务吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteTask(row.id)
    ElMessage.success('删除成功')
    if (allTasks.value.length === 1 && currentPage.value > 1) currentPage.value -= 1
    await loadTasks()
  } catch {}
}

const createDialogVisible = ref(false)
const createFormRef = ref(null)
const createForm = reactive({
  name: '',
  processId: '',
  robotId: '',
  tin: '',
  company: '',
  priority: 5,
  remark: ''
})

const createRules = reactive({
  processId: [{ required: true, message: '请选择流程', trigger: 'change' }],
  robotId: [{ required: true, message: '请选择机器人', trigger: 'change' }]
})

const processOptions = computed(() =>
  processList.value.map((f) => ({
    value: f.id || f.value,
    label: `${f.processName || f.name || f.label}（${f.processCode || f.code || f.id || f.value}）`
  }))
)

const robotOptions = computed(() =>
  robotList.value.map((r) => ({
    value: r.id || r.value,
    label: `${r.robotName || r.name || r.label}（${r.robotCode || r.code || r.id || r.value}）`
  }))
)

const getProcessNameById = (processId) => {
  if (!processId) return ''
  const id = String(processId)
  const target = processList.value.find((item) => {
    const pid = item?.id ?? item?.value ?? item?.processId
    const pcode = item?.processCode ?? item?.code
    return String(pid ?? '') === id || String(pcode ?? '') === id
  })
  return target?.processName || target?.name || target?.label || ''
}

const getRobotNameById = (robotId) => {
  if (!robotId) return ''
  const id = String(robotId)
  const target = robotList.value.find((item) => {
    const rid = item?.id ?? item?.value ?? item?.robotId
    const rcode = item?.robotCode ?? item?.code
    return String(rid ?? '') === id || String(rcode ?? '') === id
  })
  return target?.robotName || target?.name || target?.label || ''
}

const loadOptions = async () => {
  try {
    const [processesRes, robotsRes] = await Promise.all([
      getProcessOptions(),
      getRobotOptions()
    ])

    const { list: p } = unwrapPayload(processesRes)
    const { list: r } = unwrapPayload(robotsRes)
    processList.value = p
    robotList.value = r
  } catch (error) {
    processList.value = []
    robotList.value = []
    console.warn('加载选项失败:', error)
  }
}

const openCreateDialog = () => {
  createForm.name = ''
  createForm.processId = ''
  createForm.robotId = ''
  createForm.tin = ''
  createForm.company = ''
  createForm.priority = 5
  createForm.remark = ''
  createFormRef.value?.clearValidate?.()
  loadOptions()
  createDialogVisible.value = true
}

const submitCreate = async (executeNow) => {
  if (!createFormRef.value) return
  await createFormRef.value.validate(async (valid) => {
    if (!valid) return
    const payload = {
      taskName: createForm.name || '新建任务',
      processId: createForm.processId,
      robotId: createForm.robotId,
      taxpayerIdNumber: createForm.tin,
      companyName: createForm.company,
      priority: createForm.priority,
      remark: createForm.remark
    }
    try {
      const createRes = await createTask(payload)
      const createdRaw = createRes?.data ?? createRes
      const createdTask = normalizeTask(createdRaw)
      if (executeNow && createdTask.id && createdTask.robotId) {
        await dispatchRobot(createdTask.robotId, createdTask.id)
      }
      currentPage.value = 1
      createDialogVisible.value = false
      await loadTasks()
      ElMessage.success(executeNow ? '创建成功，任务已提交执行' : '创建成功')
    } catch (error) {
      console.error('创建任务失败:', error)
      ElMessage.error(error?.message || '创建任务失败')
    }
  })
}

const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  id: '',
  code: '',
  name: '',
  processId: '',
  robotId: '',
  tin: '',
  company: '',
  priority: 5,
  remark: ''
})

const submitEdit = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    if (!editForm.id) {
      ElMessage.warning('任务ID缺失，无法保存')
      return
    }
    await updateTask(editForm.id, {
      taskName: editForm.name,
      processId: editForm.processId,
      robotId: editForm.robotId,
      taxpayerIdNumber: editForm.tin,
      companyName: editForm.company,
      priority: editForm.priority,
      remark: editForm.remark
    })
    editDialogVisible.value = false
    await loadTasks()
    ElMessage.success('保存成功')
  })
}

onMounted(() => {
  loadTasks()
  loadOptions()
})
</script>

<style scoped>
.task-list-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.content-card {
  border-radius: 8px;
}

.action-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.tip {
  font-size: 12px;
  color: #999;
}

.search-form {
  background-color: #fcfcfc;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.code-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.copy-icon {
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
}

.task-table :deep(.el-table__header) th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 700;
}

.task-table :deep(.el-table__inner-wrapper) {
  overflow-x: auto;
}

.action-buttons {
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  justify-content: flex-start;
  white-space: nowrap;
}

.action-buttons :deep(.el-button) {
  margin-left: 0;
}

.action-buttons :deep(.el-button > span) {
  font-size: 12px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.create-task-form :deep(.el-input),
.create-task-form :deep(.el-select),
.create-task-form :deep(.el-textarea) {
  width: 100%;
}

.create-task-form {
  max-width: 700px;
  margin: 0 auto;
}

.create-task-form :deep(.el-form-item__label) {
  white-space: nowrap;
}

.disabled-code-input :deep(.el-input__inner) {
  color: #606266;
  -webkit-text-fill-color: #606266;
  background-color: #f5f7fa;
}

.create-task-dialog :deep(.el-dialog__body) {
  padding: 24px 40px 8px;
}

.create-task-dialog :deep(.el-dialog__footer) {
  padding: 8px 40px 20px;
}

.priority-number {
  width: 100%;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.detail-left {
  display: flex;
  align-items: center;
}

.detail-links {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin-left: 16px;
}

.detail-container {
  background-color: transparent;
  padding: 0;
}

.detail-card {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #ebeef5;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
}

.error-text {
  color: #f56c6c;
}

:deep(.desc-label) {
  width: 150px;
  background-color: #fafafa !important;
  color: #606266;
  font-weight: normal;
}

:deep(.desc-content) {
  color: #333;
}
</style>
