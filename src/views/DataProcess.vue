<template>
  <div class="data-view">
    <div class="page-title">数据加工</div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-value text-black">{{ totalCount }}</div>
        <div class="stat-label">总加工数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-green">{{ successCount }}</div>
        <div class="stat-label">成功</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-orange">{{ runningCount }}</div>
        <div class="stat-label">加工中</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-red">{{ errorCount }}</div>
        <div class="stat-label">失败</div>
      </div>
    </div>

    <el-card shadow="never" class="content-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="任务ID:">
          <el-input v-model="searchForm.taskCode" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="状态:">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 150px">
            <el-option label="已加工" value="success" />
            <el-option label="加工中" value="running" />
            <el-option label="失败" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="加工时间:">
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

      <el-table :data="pagedRows" stripe class="data-table">
        <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" />
        <el-table-column prop="taskCode" label="任务ID" min-width="180">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="goTaskDetail(row.taskCode)">{{ row.taskCode }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="parseId" label="解析ID" min-width="180">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="goParse(row.parseId)">{{ row.parseId }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small" effect="light">{{ statusLabelMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="verifyResult" label="校验结果" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.verifyResult === '通过' ? 'success' : 'danger'" size="small" effect="light">{{ row.verifyResult }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="processTime" label="加工时间" width="180" />
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="goQuery(row.taskCode)">查看</el-button>
            <el-button type="danger" link @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredRows.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ensureSeeded, rpaStore } from '../stores/rpaMockStore'

const route = useRoute()
const router = useRouter()

const searchForm = reactive({
  taskCode: '',
  status: '',
  timeRange: []
})

const appliedSearch = reactive({
  taskCode: '',
  status: '',
  timeRange: []
})

const currentPage = ref(1)
const pageSize = ref(10)
const allRows = ref([])

const statusTypeMap = {
  success: 'success',
  running: 'warning',
  error: 'danger'
}

const statusLabelMap = {
  success: '已加工',
  running: '加工中',
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

const totalCount = computed(() => allRows.value.length)
const successCount = computed(() => allRows.value.filter((r) => r.status === 'success').length)
const runningCount = computed(() => allRows.value.filter((r) => r.status === 'running').length)
const errorCount = computed(() => allRows.value.filter((r) => r.status === 'error').length)

const filteredRows = computed(() => {
  const taskCode = (appliedSearch.taskCode || '').trim()
  const status = (appliedSearch.status || '').trim()
  const range = Array.isArray(appliedSearch.timeRange) ? appliedSearch.timeRange : []
  const start = range[0] ? parseDateTime(range[0]) : null
  const end = range[1] ? parseDateTime(range[1]) : null

  return allRows.value.filter((r) => {
    const okTask = !taskCode || String(r.taskCode || '').includes(taskCode)
    const okStatus = !status || r.status === status

    if (!start || !end) return okTask && okStatus
    const ct = parseDateTime(r.processTime)
    if (!ct) return okTask && okStatus
    const time = ct.getTime()
    return okTask && okStatus && time >= start.getTime() && time <= end.getTime()
  })
})

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRows.value.slice(start, end)
})

const indexMethod = (index) => (currentPage.value - 1) * pageSize.value + index + 1

const loadRows = () => {
  ensureSeeded()
  allRows.value = rpaStore.processes
}

const onSearch = () => {
  appliedSearch.taskCode = searchForm.taskCode
  appliedSearch.status = searchForm.status
  appliedSearch.timeRange = Array.isArray(searchForm.timeRange) ? [...searchForm.timeRange] : []
  currentPage.value = 1
}

const onReset = () => {
  searchForm.taskCode = ''
  searchForm.status = ''
  searchForm.timeRange = []

  appliedSearch.taskCode = ''
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

const goTaskDetail = (taskCode) => {
  router.push({ path: '/task/list', query: { taskCode } })
}

const goParse = (parseId) => {
  router.push({ path: '/data/parse', query: { parseId } })
}

const goQuery = (taskCode) => {
  router.push({ path: '/data/query', query: { taskCode } })
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该记录吗？', '提示', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' })
    const idx = rpaStore.processes.findIndex((r) => r.processId === row.processId)
    if (idx >= 0) rpaStore.processes.splice(idx, 1)
    ElMessage.success('删除成功')
  } catch {}
}

const applyQuery = () => {
  const taskCode = typeof route.query.taskCode === 'string' ? route.query.taskCode : ''
  const parseId = typeof route.query.parseId === 'string' ? route.query.parseId : ''
  if (parseId) {
    const row = allRows.value.find((r) => r.parseId === parseId)
    if (row?.taskCode) {
      searchForm.taskCode = row.taskCode
      appliedSearch.taskCode = row.taskCode
      currentPage.value = 1
      return
    }
  }
  if (taskCode) {
    searchForm.taskCode = taskCode
    appliedSearch.taskCode = taskCode
    currentPage.value = 1
  }
}

watch(
  () => [route.query.taskCode, route.query.parseId],
  () => applyQuery()
)

onMounted(() => {
  loadRows()
  applyQuery()
})
</script>

<style scoped>
.data-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.stats-cards {
  display: flex;
  gap: 16px;
}

.stat-card {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #ebeef5;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.text-black { color: #333; }
.text-green { color: #67c23a; }
.text-orange { color: #e6a23c; }
.text-red { color: #f56c6c; }

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

.data-table :deep(.el-table__header) th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 700;
}

.data-table :deep(.el-table__inner-wrapper) {
  overflow-x: auto;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-tag.el-tag--danger.el-tag--light) {
  background-color: #fef0f0;
  border-color: transparent;
  color: #f56c6c;
}

:deep(.el-tag.el-tag--success.el-tag--light) {
  background-color: #f0f9eb;
  border-color: transparent;
  color: #67c23a;
}

:deep(.el-tag.el-tag--warning.el-tag--light) {
  background-color: #fdf6ec;
  border-color: transparent;
  color: #e6a23c;
}
</style>

