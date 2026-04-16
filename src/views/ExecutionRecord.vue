<template>
  <div class="execution-record-view">
    <template v-if="!showDetail">
      <div class="page-title">执行记录</div>

      <el-card shadow="never" class="content-card">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="任务ID:">
            <el-input v-model="searchForm.taskId" placeholder="任务ID" clearable style="width: 180px" />
          </el-form-item>
          <el-form-item label="执行状态:">
            <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 150px">
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
          <el-form-item class="search-actions">
            <el-button type="primary" @click="onSearch">查询</el-button>
            <el-button @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="pagedRecords" stripe class="record-table">
          <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" />
          <el-table-column prop="execId" label="执行ID" min-width="180" />
          <el-table-column prop="taskCode" label="任务编码" min-width="180">
            <template #default="{ row }">
              <el-link type="primary" :underline="false" @click="goTaskDetail(row.taskCode)">{{ row.taskCode }}</el-link>
            </template>
          </el-table-column>
          <el-table-column prop="processCode" label="流程编码" min-width="150" />
          <el-table-column prop="robotCode" label="机器人编码" min-width="150" />
          <el-table-column prop="status" label="执行状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTypeMap[row.status]" size="small" effect="light">
                {{ statusLabelMap[row.status] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="startTime" label="开始时间" width="180" />
          <el-table-column prop="endTime" label="结束时间" width="180" />
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
    </template>

    <template v-else>
      <div class="detail-header">
        <div class="detail-left">
          <el-button @click="closeDetail">返回</el-button>
          <span class="detail-title">执行记录详情</span>
        </div>
        <div class="detail-links">
          <el-button type="primary" link @click="goTaskDetail(currentDetail.taskCode)">任务详情</el-button>
        </div>
      </div>

      <div class="detail-container">
        <div class="detail-card">
          <div class="section-title">执行基础信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="执行ID">{{ currentDetail.execId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="任务编码">{{ currentDetail.taskCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="流程编码">{{ currentDetail.processCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="机器人编码">{{ currentDetail.robotCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="执行状态">
              <el-tag :type="statusTypeMap[currentDetail.status]" size="small" effect="light">
                {{ statusLabelMap[currentDetail.status] || currentDetail.status || '-' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="执行时长">{{ durationText }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ currentDetail.startTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ currentDetail.endTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="错误信息" :span="2">
              <span :class="{ 'error-text': isFailed }">{{ currentDetail.errorMessage || '-' }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-card" style="margin-top: 16px;">
          <div class="section-title">关联任务信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="任务名称">{{ relatedTask.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="企业名称">{{ relatedTask.company || '-' }}</el-descriptions-item>
            <el-descriptions-item label="纳税人识别号">{{ relatedTask.tin || '-' }}</el-descriptions-item>
            <el-descriptions-item label="优先级">{{ relatedTask.priority ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="任务状态">{{ relatedTask.status || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ relatedTask.createTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ relatedTask.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-card" style="margin-top: 16px;">
          <div class="section-title">执行链路信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="采集记录ID">{{ pipeline.collect?.collectId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="采集状态">{{ pipeline.collect?.status || '-' }}</el-descriptions-item>
            <el-descriptions-item label="解析记录ID">{{ pipeline.parse?.parseId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="解析状态">{{ pipeline.parse?.status || '-' }}</el-descriptions-item>
            <el-descriptions-item label="加工记录ID">{{ pipeline.process?.processId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="加工状态">{{ pipeline.process?.status || '-' }}</el-descriptions-item>
            <el-descriptions-item label="查询记录ID">{{ pipeline.query?.queryId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="数据状态">{{ pipeline.query?.dataStatus || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTaskExecutions } from '../api/task'
import { ensureSeeded, findTaskByCode, rpaStore } from '../stores/rpaMockStore'

const route = useRoute()
const router = useRouter()

const searchForm = reactive({
  taskId: '',
  status: '',
  timeRange: []
})

const appliedSearch = reactive({
  taskId: '',
  status: '',
  timeRange: []
})

const currentPage = ref(1)
const pageSize = ref(10)
const showDetail = ref(false)
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

const relatedTask = computed(() => findTaskByCode(currentDetail.value?.taskCode) || {})

const pipeline = computed(() => {
  const taskCode = currentDetail.value?.taskCode
  const startTime = currentDetail.value?.startTime
  if (!taskCode) return {}

  const matchByTaskAndTime = (item, timeKey) => {
    if (!item || item.taskCode !== taskCode) return false
    if (!startTime) return true
    return item[timeKey] === startTime || item.createTime === currentDetail.value?.endTime
  }

  return {
    collect: [...rpaStore.collects].find((item) => matchByTaskAndTime(item, 'collectTime')),
    parse: [...rpaStore.parses].find((item) => item.taskCode === taskCode),
    process: [...rpaStore.processes].find((item) => item.taskCode === taskCode),
    query: [...rpaStore.queries].find((item) => item.taskCode === taskCode)
  }
})

const isFailed = computed(() => ['FAILED', 'error'].includes(currentDetail.value?.status))

const durationText = computed(() => {
  const start = parseDateTime(currentDetail.value?.startTime)
  const end = parseDateTime(currentDetail.value?.endTime)
  if (!start || !end) return '-'
  const diff = Math.max(0, end.getTime() - start.getTime())
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}秒`
  const min = Math.floor(sec / 60)
  const remain = sec % 60
  return remain ? `${min}分${remain}秒` : `${min}分`
})

const loadMockRecords = () => {
  ensureSeeded()
  allRecords.value = rpaStore.executions
}

const buildExecutionParams = () => {
  const params = {}
  const taskId = (searchForm.taskId || '').trim()
  const status = (searchForm.status || '').trim()
  const range = Array.isArray(searchForm.timeRange) ? searchForm.timeRange : []

  if (taskId) {
    params.taskId = taskId
    params.taskCode = taskId
    params.execId = taskId
  }
  if (status) params.status = status
  if (range[0]) params.startTime = range[0]
  if (range[1]) params.endTime = range[1]

  return params
}

const syncAppliedSearch = () => {
  appliedSearch.taskId = searchForm.taskId
  appliedSearch.status = searchForm.status
  appliedSearch.timeRange = Array.isArray(searchForm.timeRange) ? [...searchForm.timeRange] : []
}

const loadRecords = async ({ silent = false } = {}) => {
  loading.value = true
  try {
    const res = await getTaskExecutions(buildExecutionParams())
    allRecords.value = Array.isArray(res?.list) ? res.list : []
  } catch (error) {
    console.warn('执行记录接口不可用，降级使用本地 mock 数据', error)
    loadMockRecords()
    if (!silent) {
      ElMessage.warning('执行记录接口暂不可用，当前显示本地测试数据')
    }
  } finally {
    loading.value = false
  }
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

const filteredRecords = computed(() => {
  const taskId = (appliedSearch.taskId || '').trim()
  const status = (appliedSearch.status || '').trim()
  const range = Array.isArray(appliedSearch.timeRange) ? appliedSearch.timeRange : []
  const start = range[0] ? parseDateTime(range[0]) : null
  const end = range[1] ? parseDateTime(range[1]) : null

  return allRecords.value.filter((r) => {
    const okTaskId = !taskId || String(r.execId || '').includes(taskId) || String(r.taskCode || '').includes(taskId)
    const okStatus = !status || r.status === status

    if (!start || !end) return okTaskId && okStatus
    const ct = parseDateTime(r.startTime)
    if (!ct) return okTaskId && okStatus
    const time = ct.getTime()
    return okTaskId && okStatus && time >= start.getTime() && time <= end.getTime()
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
  searchForm.status = ''
  searchForm.timeRange = []

  appliedSearch.taskId = ''
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
  showDetail.value = true
  router.replace({ path: '/task/record', query: { ...route.query, execId: row.execId } })
}

const closeDetail = () => {
  showDetail.value = false
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
  showDetail.value = true
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
    showDetail.value = false
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
  })
})
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

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.detail-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.detail-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
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
