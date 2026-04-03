<template>
  <div class="execution-record-view">
    <div class="page-title">执行记录</div>
    
    <el-card shadow="never" class="content-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="任务ID:">
          <el-input v-model="searchForm.taskId" placeholder="任务ID" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="执行状态:">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 150px">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="error" />
            <el-option label="执行中" value="running" />
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
            <el-button type="primary" link @click="goTaskDetail(row.taskCode)">查看详情</el-button>
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
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ensureSeeded, rpaStore } from '../stores/rpaMockStore'

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

const statusTypeMap = {
  success: 'success',
  error: 'danger',
  running: 'warning'
}

const statusLabelMap = {
  success: '成功',
  error: '失败',
  running: '执行中'
}

const allRecords = ref([])

const loadRecords = () => {
  ensureSeeded()
  allRecords.value = rpaStore.executions
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
  appliedSearch.taskId = searchForm.taskId
  appliedSearch.status = searchForm.status
  appliedSearch.timeRange = Array.isArray(searchForm.timeRange) ? [...searchForm.timeRange] : []
  currentPage.value = 1
}

const onReset = () => {
  searchForm.taskId = ''
  searchForm.status = ''
  searchForm.timeRange = []

  appliedSearch.taskId = ''
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

const applyQuery = () => {
  const taskCode = typeof route.query.taskCode === 'string' ? route.query.taskCode : ''
  if (taskCode) {
    searchForm.taskId = taskCode
    appliedSearch.taskId = taskCode
    currentPage.value = 1
  }
}

watch(
  () => route.query.taskCode,
  () => applyQuery()
)

onMounted(() => {
  loadRecords()
  applyQuery()
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
