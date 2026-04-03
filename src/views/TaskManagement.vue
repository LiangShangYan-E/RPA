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
            <el-option label="待执行" value="idle" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="error" />
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

      <el-table :data="pagedTasks" stripe class="task-table">
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
        <el-table-column prop="status" label="任务状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small" effect="light">
              {{ statusLabelMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
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
          :total="filteredTasks.length"
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
            <el-descriptions-item label="机器人编码" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.robotId }}</el-descriptions-item>
            <el-descriptions-item label="任务状态" label-class-name="desc-label" class-name="desc-content">
              <el-tag :type="statusTypeMap[currentDetail.status]" size="small" effect="light">
                {{ statusLabelMap[currentDetail.status] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.createTime }}</el-descriptions-item>
            <el-descriptions-item label="开始时间" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.startTime }}</el-descriptions-item>
            <el-descriptions-item label="结束时间" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.endTime }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-card" style="margin-top: 16px;">
          <div class="section-title">执行记录</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="开始时间" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.startTime }}</el-descriptions-item>
            <el-descriptions-item label="结束时间" label-class-name="desc-label" class-name="desc-content">{{ currentDetail.endTime }}</el-descriptions-item>
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
import { createTask, deleteTask, ensureSeeded, executeTask, findTaskByCode, rpaStore, updateTask } from '../stores/rpaMockStore'

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

const statusTypeMap = {
  running: 'warning',
  completed: 'success',
  idle: 'info',
  error: 'danger'
}

const statusLabelMap = {
  running: '执行中',
  completed: '已完成',
  idle: '待执行',
  error: '失败'
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

const filteredTasks = computed(() => {
  const keyword = (appliedSearch.keyword || '').trim()
  const status = (appliedSearch.status || '').trim()
  const range = Array.isArray(appliedSearch.timeRange) ? appliedSearch.timeRange : []
  const start = range[0] ? parseDateTime(range[0]) : null
  const end = range[1] ? parseDateTime(range[1]) : null

  return allTasks.value.filter((t) => {
    const okKeyword =
      !keyword ||
      String(t.code || '').includes(keyword) ||
      String(t.name || '').includes(keyword)
    const okStatus = !status || t.status === status

    if (!start || !end) return okKeyword && okStatus
    const ct = parseDateTime(t.createTime)
    if (!ct) return okKeyword && okStatus
    const time = ct.getTime()
    return okKeyword && okStatus && time >= start.getTime() && time <= end.getTime()
  })
})

const pagedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTasks.value.slice(start, end)
})

const indexMethod = (index) => (currentPage.value - 1) * pageSize.value + index + 1

const loadTasks = () => {
  ensureSeeded()
  allTasks.value = rpaStore.tasks
}

const onSearch = () => {
  appliedSearch.keyword = searchForm.keyword
  appliedSearch.status = searchForm.status
  appliedSearch.timeRange = Array.isArray(searchForm.timeRange) ? [...searchForm.timeRange] : []
  currentPage.value = 1
}

const onReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.timeRange = []

  appliedSearch.keyword = ''
  appliedSearch.status = ''
  appliedSearch.timeRange = []

  currentPage.value = 1
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const copyText = async (text) => {
  const v = text == null ? '' : String(text)
  if (!v) return
  try {
    await navigator.clipboard.writeText(v)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

const showDetail = ref(false)
const currentDetail = ref({})

const onViewDetail = (row) => {
  currentDetail.value = {
    ...row,
    processId: row.processId || '1',
    robotId: row.robotId || '机器人001',
    startTime: row.startTime || '2026-03-25T10:28:55',
    endTime: row.endTime || '2026-03-25T10:28:58',
    duration: row.duration || '3秒',
    errorMessage: row.status === 'error' ? '-' : '-'
  }
  showDetail.value = true
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
  const t = findTaskByCode(taskCode)
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
  currentRow.value = row
  editForm.code = row.code || ''
  editForm.name = row.name || ''
  editForm.processId = row.processId || '1'
  editForm.robotId = row.robotId || 'A001'
  editForm.tin = row.tin || ''
  editForm.company = row.company || ''
  editForm.priority = row.priority ?? 5
  editForm.remark = row.remark || ''
  
  editFormRef.value?.clearValidate?.()
  editDialogVisible.value = true
}

const onExecute = (row) => {
  if (!row) return
  if (row.status === 'completed') {
    ElMessage.info('该任务已完成')
    return
  }
  executeTask(row.code, { status: 'success' })
  ElMessage.success('执行成功')
}

const onDelete = async (row) => {
  if (!row) return
  try {
    await ElMessageBox.confirm('确定要删除该任务吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    deleteTask(row.code)
    if ((currentPage.value - 1) * pageSize.value >= filteredTasks.value.length && currentPage.value > 1) {
      currentPage.value -= 1
    }
    ElMessage.success('删除成功')
  } catch {}
}

const normalizeTask = (t) => ({
  code: t?.code ?? '',
  name: t?.name ?? '',
  tin: t?.tin ?? '',
  company: t?.company ?? '',
  status: t?.status ?? 'idle',
  createTime: t?.createTime ?? t?.create_time ?? t?.createdAt ?? t?.created_at ?? ''
})

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
  rpaStore.flows.map((f) => ({
    value: f.id,
    label: `${f.name}（${f.code}）`
  }))
)

const robotOptions = computed(() =>
  rpaStore.robots.map((r) => ({
    value: r.id,
    label: `${r.code}（${r.id}）`
  }))
)

const openCreateDialog = () => {
  createForm.name = ''
  createForm.processId = ''
  createForm.robotId = ''
  createForm.tin = ''
  createForm.company = ''
  createForm.priority = 5
  createForm.remark = ''
  createFormRef.value?.clearValidate?.()
  createDialogVisible.value = true
}

const formatDateTime = (d) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const generateTaskCode = () => {
  const now = Date.now().toString()
  const rnd = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  return `${now}${rnd}`
}

const submitCreate = async (executeNow) => {
  if (!createFormRef.value) return
  await createFormRef.value.validate(async (valid) => {
    if (!valid) return
    const now = new Date()
    const task = createTask({
      code: `TASK_${generateTaskCode()}`,
      name: createForm.name || '新建任务',
      tin: createForm.tin,
      company: createForm.company,
      processId: createForm.processId,
      robotId: createForm.robotId,
      priority: createForm.priority,
      remark: createForm.remark,
      status: executeNow ? 'running' : 'idle',
      createTime: formatDateTime(now)
    })
    if (executeNow) executeTask(task.code, { status: 'success' })
    currentPage.value = 1
    createDialogVisible.value = false
    ElMessage.success(executeNow ? '创建并开始执行' : '创建成功')
  })
}

const editDialogVisible = ref(false)
const editFormRef = ref(null)
const currentRow = ref(null)
const editForm = reactive({
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
    
    updateTask(editForm.code, {
      name: editForm.name,
      processId: editForm.processId,
      robotId: editForm.robotId,
      tin: editForm.tin,
      company: editForm.company,
      priority: editForm.priority,
      remark: editForm.remark
    })
    
    editDialogVisible.value = false
    ElMessage.success('保存成功')
  })
}

onMounted(loadTasks)
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
