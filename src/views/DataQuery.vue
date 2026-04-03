<template>
  <div class="data-view">
    <div class="page-title">数据查询</div>

    <el-card shadow="never" class="content-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键字:">
          <el-input v-model="searchForm.keyword" placeholder="纳税人识别号/企业名称" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="任务ID:">
          <el-input v-model="searchForm.taskCode" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="税区ID:">
          <el-input v-model="searchForm.taxAreaId" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="数据状态:">
          <el-select v-model="searchForm.dataStatus" placeholder="请选择" clearable style="width: 150px">
            <el-option label="可用" value="available" />
            <el-option label="不可用" value="unavailable" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间:">
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
        <el-table-column type="selection" width="50" />
        <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" />
        <el-table-column prop="taskCode" label="任务ID" min-width="180">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="goTaskDetail(row.taskCode)">{{ row.taskCode }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="tin" label="纳税人识别号" min-width="180" />
        <el-table-column prop="company" label="企业名称" min-width="220" show-overflow-tooltip />
        <el-table-column prop="taxAreaId" label="税区ID" width="120" align="center" />
        <el-table-column prop="dataStatus" label="数据状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.dataStatus === 'available' ? 'success' : 'info'" size="small" effect="light">
              {{ row.dataStatus === 'available' ? '可用' : '不可用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="goTaskDetail(row.taskCode)">查看</el-button>
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
  keyword: '',
  taskCode: '',
  taxAreaId: '',
  dataStatus: '',
  timeRange: []
})

const appliedSearch = reactive({
  keyword: '',
  taskCode: '',
  taxAreaId: '',
  dataStatus: '',
  timeRange: []
})

const currentPage = ref(1)
const pageSize = ref(10)
const allRows = ref([])

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

const filteredRows = computed(() => {
  const keyword = (appliedSearch.keyword || '').trim()
  const taskCode = (appliedSearch.taskCode || '').trim()
  const taxAreaId = (appliedSearch.taxAreaId || '').trim()
  const dataStatus = (appliedSearch.dataStatus || '').trim()
  const range = Array.isArray(appliedSearch.timeRange) ? appliedSearch.timeRange : []
  const start = range[0] ? parseDateTime(range[0]) : null
  const end = range[1] ? parseDateTime(range[1]) : null

  return allRows.value.filter((r) => {
    const okKeyword =
      !keyword || String(r.tin || '').includes(keyword) || String(r.company || '').includes(keyword)
    const okTask = !taskCode || String(r.taskCode || '').includes(taskCode)
    const okTax = !taxAreaId || String(r.taxAreaId || '').includes(taxAreaId)
    const okStatus = !dataStatus || r.dataStatus === dataStatus

    if (!start || !end) return okKeyword && okTask && okTax && okStatus
    const ct = parseDateTime(r.createTime)
    if (!ct) return okKeyword && okTask && okTax && okStatus
    const time = ct.getTime()
    return okKeyword && okTask && okTax && okStatus && time >= start.getTime() && time <= end.getTime()
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
  allRows.value = rpaStore.queries
}

const onSearch = () => {
  appliedSearch.keyword = searchForm.keyword
  appliedSearch.taskCode = searchForm.taskCode
  appliedSearch.taxAreaId = searchForm.taxAreaId
  appliedSearch.dataStatus = searchForm.dataStatus
  appliedSearch.timeRange = Array.isArray(searchForm.timeRange) ? [...searchForm.timeRange] : []
  currentPage.value = 1
}

const onReset = () => {
  searchForm.keyword = ''
  searchForm.taskCode = ''
  searchForm.taxAreaId = ''
  searchForm.dataStatus = ''
  searchForm.timeRange = []

  appliedSearch.keyword = ''
  appliedSearch.taskCode = ''
  appliedSearch.taxAreaId = ''
  appliedSearch.dataStatus = ''
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

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该记录吗？', '提示', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' })
    const idx = rpaStore.queries.findIndex((r) => r.queryId === row.queryId)
    if (idx >= 0) rpaStore.queries.splice(idx, 1)
    ElMessage.success('删除成功')
  } catch {}
}

const applyQuery = () => {
  const taskCode = typeof route.query.taskCode === 'string' ? route.query.taskCode : ''
  if (taskCode) {
    searchForm.taskCode = taskCode
    appliedSearch.taskCode = taskCode
    currentPage.value = 1
  }
}

watch(
  () => route.query.taskCode,
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

:deep(.el-tag.el-tag--success.el-tag--light) {
  background-color: #f0f9eb;
  border-color: transparent;
  color: #67c23a;
}

:deep(.el-tag.el-tag--info.el-tag--light) {
  background-color: #f4f4f5;
  border-color: transparent;
  color: #909399;
}
</style>

