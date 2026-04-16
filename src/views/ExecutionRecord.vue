<template>
  <div class="execution-record-view">
    <div class="page-title">执行记录</div>
    <el-card shadow="never" class="content-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="任务ID:">
          <el-input v-model="searchForm.taskId" placeholder="任务ID" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="执行ID:">
          <el-input v-model="searchForm.execId" placeholder="执行ID" clearable style="width: 210px" />
        </el-form-item>
        <el-form-item label="执行状态:">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 140px">
            <el-option label="成功" value="SUCCESS" />
            <el-option label="失败" value="FAILED" />
            <el-option label="执行中" value="RUNNING" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行时间:">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="pagedRecords" stripe class="record-table" v-loading="loading">
        <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" />
        <el-table-column prop="execId" label="执行ID" min-width="180" />
        <el-table-column prop="taskCode" label="任务编码" min-width="180">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="goTaskDetail(row.taskCode)">{{ row.taskCode }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="processCode" label="流程编码" min-width="120" />
        <el-table-column prop="robotCode" label="机器人编码" min-width="120" />
        <el-table-column prop="status" label="执行状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small" effect="light">
              {{ statusLabelMap[row.status] || row.status || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column prop="endTime" label="结束时间" width="160" />
        <el-table-column label="执行时长" width="90" align="center">
          <template #default="{ row }">{{ calcDurationText(row) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredRecords.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="detailVisible"
      title="执行记录详情"
      width="920px"
      :close-on-click-modal="false"
      @close="closeDetail"
    >
      <div class="detail-panel">
        <div class="result-banner" :class="resultBannerClass">
          <div class="result-banner__label">执行结果</div>
          <div class="result-banner__main">
            <el-tag :type="statusTypeMap[currentDetail.status]" size="small" effect="light">
              {{ statusLabelMap[currentDetail.status] || currentDetail.status || '-' }}
            </el-tag>
            <span class="result-banner__text">{{ detailResultText }}</span>
          </div>
          <div class="result-banner__sub">{{ detailResultHint }}</div>
        </div>

        <div class="detail-grid">
          <div class="detail-item"><span class="label">执行ID</span><span>{{ currentDetail.execId || '-' }}</span></div>
          <div class="detail-item"><span class="label">任务编码</span><span>{{ currentDetail.taskCode || '-' }}</span></div>
          <div class="detail-item"><span class="label">流程编码</span><span>{{ currentDetail.processCode || '-' }}</span></div>
          <div class="detail-item"><span class="label">机器人编码</span><span>{{ currentDetail.robotCode || '-' }}</span></div>
          <div class="detail-item"><span class="label">执行时长</span><span>{{ currentDurationText }}</span></div>
          <div class="detail-item"><span class="label">开始时间</span><span>{{ currentDetail.startTime || '-' }}</span></div>
          <div class="detail-item"><span class="label">结束时间</span><span>{{ currentDetail.endTime || '-' }}</span></div>
        </div>

        <div v-if="showSuccessBox" class="result-box result-box--success">
          <div class="result-box__title">执行说明</div>
          <div class="result-box__content">执行成功</div>
        </div>

        <div v-if="showErrorBox" class="result-box result-box--error">
          <div class="result-box__title">错误信息</div>
          <div class="result-box__content">{{ detailErrorMessage }}</div>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeDetail">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTaskExecutions } from '../api/task'

const route = useRoute()
const router = useRouter()

const searchForm = reactive({
  taskId: '',
  execId: '',
  status: '',
  timeRange: []
})

const appliedSearch = reactive({
  taskId: '',
  execId: '',
  status: '',
  timeRange: []
})

const currentPage = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)
const currentDetail = ref({})
const loading = ref(false)

const statusTypeMap = {
  success: 'success',
  SUCCESS: 'success',
  error: 'danger',
  FAILED: 'danger',
  running: 'warning',
  RUNNING: 'warning'
}

const statusLabelMap = {
  success: '成功',
  SUCCESS: '成功',
  error: '失败',
  FAILED: '失败',
  running: '执行中',
  RUNNING: '执行中'
}

const allRecords = ref([])

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

const calcDurationText = (record) => {
  const secRaw = Number(record?.durationSec ?? 0)
  if (secRaw > 0) {
    const sec = Math.floor(secRaw)
    if (sec < 60) return `${sec}秒`
    const min = Math.floor(sec / 60)
    const remain = sec % 60
    return remain ? `${min}分${remain}秒` : `${min}分`
  }
  const start = parseDateTime(record?.startTime)
  const end = parseDateTime(record?.endTime)
  if (!start || !end) return '-'
  const diff = Math.max(0, end.getTime() - start.getTime())
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}秒`
  const min = Math.floor(sec / 60)
  const remain = sec % 60
  return remain ? `${min}分${remain}秒` : `${min}分`
}

const currentDurationText = computed(() => calcDurationText(currentDetail.value))

const detailErrorMessage = computed(
  () =>
    currentDetail.value?.errorMessage ||
    currentDetail.value?.error ||
    currentDetail.value?.message ||
    ''
)

const isSuccessDetail = computed(() => ['success', 'SUCCESS'].includes(currentDetail.value?.status))
const isFailedDetail = computed(
  () => ['error', 'FAILED'].includes(currentDetail.value?.status) || !!detailErrorMessage.value
)

const detailResultText = computed(() => {
  if (isFailedDetail.value) return '执行失败'
  if (isSuccessDetail.value) return '执行成功'
  return '执行中'
})

const detailResultHint = computed(() => {
  if (isFailedDetail.value) return '本次执行未完成，请根据错误信息定位问题。'
  if (isSuccessDetail.value) return '本次任务已成功执行完成。'
  return '任务仍在执行中，请稍后刷新查看最新状态。'
})

const resultBannerClass = computed(() => {
  if (isFailedDetail.value) return 'result-banner--error'
  if (isSuccessDetail.value) return 'result-banner--success'
  return 'result-banner--running'
})

const showSuccessBox = computed(() => isSuccessDetail.value)
const showErrorBox = computed(() => isFailedDetail.value && !!detailErrorMessage.value)

const buildExecutionParams = () => {
  const params = {}
  const taskId = (searchForm.taskId || '').trim()
  const execId = (searchForm.execId || '').trim()
  const status = (searchForm.status || '').trim()
  const range = Array.isArray(searchForm.timeRange) ? searchForm.timeRange : []

  if (taskId) {
    params.taskId = taskId
    params.taskCode = taskId
  }
  if (execId) params.execId = execId
  if (status) params.status = status
  if (range[0]) params.startTime = range[0]
  if (range[1]) params.endTime = range[1]

  return params
}

const syncAppliedSearch = () => {
  appliedSearch.taskId = searchForm.taskId
  appliedSearch.execId = searchForm.execId
  appliedSearch.status = searchForm.status
  appliedSearch.timeRange = Array.isArray(searchForm.timeRange) ? [...searchForm.timeRange] : []
}

const loadRecords = async ({ silent = false } = {}) => {
  loading.value = true
  try {
    const res = await getTaskExecutions(buildExecutionParams())
    allRecords.value = Array.isArray(res?.list) ? res.list : []
  } catch (error) {
    console.warn('执行记录接口调用失败', error)
    allRecords.value = []
    if (!silent) {
      ElMessage.warning('执行记录接口调用失败')
    }
  } finally {
    loading.value = false
  }
}

const refreshCurrentDetailFromRecords = () => {
  if (!detailVisible.value || !currentDetail.value?.execId) return
  const latest = allRecords.value.find((item) => item.execId === currentDetail.value.execId)
  if (!latest) return
  currentDetail.value = { ...latest }
}

const filteredRecords = computed(() => {
  const taskId = (appliedSearch.taskId || '').trim()
  const execId = (appliedSearch.execId || '').trim()
  const status = (appliedSearch.status || '').trim()
  const range = Array.isArray(appliedSearch.timeRange) ? appliedSearch.timeRange : []
  const start = range[0] ? parseDateTime(range[0]) : null
  const end = range[1] ? parseDateTime(range[1]) : null

  return allRecords.value.filter((r) => {
    const okTaskId = !taskId || String(r.taskCode || '').includes(taskId)
    const okExecId = !execId || String(r.execId || '').includes(execId)
    const okStatus = !status || r.status === status

    if (!start || !end) return okTaskId && okExecId && okStatus
    const ct = parseDateTime(r.startTime)
    if (!ct) return okTaskId && okExecId && okStatus
    const time = ct.getTime()
    return okTaskId && okExecId && okStatus && time >= start.getTime() && time <= end.getTime()
  })
})

const pagedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRecords.value.slice(start, end)
})

const indexMethod = (index) => (currentPage.value - 1) * pageSize.value + index + 1

const onSearch = () => {
  syncAppliedSearch()
  currentPage.value = 1
  loadRecords()
}

const onReset = () => {
  searchForm.taskId = ''
  searchForm.execId = ''
  searchForm.status = ''
  searchForm.timeRange = []

  appliedSearch.taskId = ''
  appliedSearch.execId = ''
  appliedSearch.status = ''
  appliedSearch.timeRange = []

  currentPage.value = 1
  loadRecords()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const goTaskDetail = (taskCode) => {
  router.push({ path: '/task/list', query: { taskCode } })
}

const openDetail = (row) => {
  currentDetail.value = { ...row }
  detailVisible.value = true
  router.replace({ path: '/task/record', query: { ...route.query, execId: row.execId } })
}

const closeDetail = () => {
  detailVisible.value = false
  currentDetail.value = {}
  const query = { ...route.query }
  delete query.execId
  router.replace({ path: '/task/record', query })
}

const openDetailByExecId = (execId) => {
  if (!execId) return false
  const row = allRecords.value.find((item) => item.execId === execId)
  if (!row) return false
  currentDetail.value = { ...row }
  detailVisible.value = true
  return true
}

const applyQuery = () => {
  const taskCode = typeof route.query.taskCode === 'string' ? route.query.taskCode : ''
  const execId = typeof route.query.execId === 'string' ? route.query.execId : ''
  if (taskCode) {
    searchForm.taskId = taskCode
  } else if (!route.query.execId) {
    searchForm.taskId = ''
  }
  syncAppliedSearch()
  currentPage.value = 1
  if (!execId) {
    detailVisible.value = false
    currentDetail.value = {}
    return
  }
  openDetailByExecId(execId)
}

watch(
  () => [route.query.taskCode, route.query.execId],
  () => applyQuery()
)

onMounted(() => {
  applyQuery()
  loadRecords({ silent: true }).then(() => {
    applyQuery()
    refreshCurrentDetailFromRecords()
  })
})

watch(
  () => detailVisible.value,
  () => {
    refreshCurrentDetailFromRecords()
  }
)
</script>

<style scoped>
.execution-record-view {
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

.search-form {
  background-color: #fcfcfc;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 24px;
}

.search-actions {
  margin-right: 0 !important;
  margin-left: auto;
}

.record-table :deep(.el-table__header) th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 700;
}

.record-table :deep(.el-table__inner-wrapper) {
  overflow-x: auto;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.error-text {
  color: #f56c6c;
}

.detail-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-banner {
  border-radius: 12px;
  padding: 18px 20px;
  border: 1px solid transparent;
  background: #f5f7fa;
}

.result-banner__label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
}

.result-banner__main {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.result-banner__text {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.result-banner__sub {
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
}

.result-banner--success {
  background: linear-gradient(135deg, #f0f9eb 0%, #f7fff2 100%);
  border-color: #d9f0c7;
}

.result-banner--error {
  background: linear-gradient(135deg, #fef0f0 0%, #fff7f7 100%);
  border-color: #f7c9c9;
}

.result-banner--running {
  background: linear-gradient(135deg, #fdf6ec 0%, #fffaf3 100%);
  border-color: #f3d19e;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-item {
  min-height: 56px;
  display: grid;
  grid-template-columns: 110px 1fr;
  align-items: stretch;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.detail-item .label {
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: #f7f9fc;
  color: #606266;
  border-right: 1px solid #ebeef5;
}

.detail-item > span:last-child {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  color: #303133;
  word-break: break-all;
}

.result-box {
  border-radius: 12px;
  padding: 16px 18px;
  border: 1px solid #ebeef5;
}

.result-box--success {
  background: #f6ffed;
  border-color: #d9f0c7;
}

.result-box--error {
  background: #fff7f7;
  border-color: #f7c9c9;
}

.result-box__title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
}

.result-box--success .result-box__title,
.result-box--success .result-box__content {
  color: #67c23a;
}

.result-box--error .result-box__title,
.result-box--error .result-box__content {
  color: #f56c6c;
}

.result-box__content {
  white-space: pre-wrap;
  line-height: 1.7;
  word-break: break-word;
}

/* 自定义失败状态的 tag 样式，去掉边框并使用浅红底红字 */
:deep(.el-tag.el-tag--danger.el-tag--light) {
  background-color: #fef0f0;
  border-color: transparent;
  color: #f56c6c;
}

/* 自定义成功状态的 tag 样式，去掉边框并使用浅绿底绿字 */
:deep(.el-tag.el-tag--success.el-tag--light) {
  background-color: #f0f9eb;
  border-color: transparent;
  color: #67c23a;
}
</style>
