<template>
  <div class="data-view">
    <div class="page-title">数据查询</div>

    <el-alert
      v-if="isExecutionMode"
      type="info"
      :closable="false"
      show-icon
      class="execution-alert"
      :title="`当前按执行记录查询：${appliedSearch.executionId}`"
      description="已使用“按执行记录查询”专用接口，仅支持分页与数据状态筛选。"
    />

    <el-card shadow="never" class="content-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键字:">
          <el-input v-model="searchForm.keyword" placeholder="数据编号/执行ID/任务编码/标题/内容" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="任务ID:">
          <!-- [修复] 统一使用 taskId -->
          <el-input v-model="searchForm.taskId" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="执行ID:">
          <el-input v-model="searchForm.executionId" placeholder="请输入执行ID" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="数据状态:">
          <el-select v-model="searchForm.dataStatus" placeholder="请选择" clearable style="width: 150px">
            <el-option label="正常" value="NORMAL" />
            <el-option label="已修正" value="CORRECTED" />
            <el-option label="异常" value="ERROR" />
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
          <el-button v-if="searchForm.executionId" type="warning" plain @click="clearExecutionFilter">清除执行记录筛选</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="rows" v-loading="loading" stripe class="data-table">
        <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" />
        <el-table-column prop="id" label="数据ID" width="110" />
        <el-table-column prop="taskId" label="任务ID" min-width="180">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="goTaskDetail(row.taskId)">{{ row.taskId }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="executionId" label="执行ID" min-width="180" />
        <el-table-column prop="dataTitle" label="数据标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="dataStatus" label="数据状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.dataStatus]" size="small" effect="light">
              {{ statusLabelMap[row.dataStatus] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDetail(row.id)">查看</el-button>
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
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="detailVisible"
      title="查询数据详情"
      width="920px"
      :close-on-click-modal="false"
      @close="closeDetail"
    >
      <el-alert
        v-if="currentDetail.deleted === 1"
        type="warning"
        :closable="false"
        show-icon
        class="detail-alert"
        title="该数据已删除（逻辑删除）"
      />

      <el-alert
        v-if="errorSummary"
        type="error"
        :closable="false"
        show-icon
        class="detail-alert"
        :title="errorSummary.title"
        :description="errorSummary.description"
      />

      <div class="detail-grid">
        <div class="detail-item"><span class="label">数据ID</span><span>{{ displayValue(currentDetail.id) }}</span></div>
        <div class="detail-item"><span class="label">数据编号</span><span>{{ displayValue(currentDetail.dataNo) }}</span></div>
        <div class="detail-item"><span class="label">任务ID</span><span>{{ displayValue(currentDetail.taskId) }}</span></div>
        <div class="detail-item">
          <span class="label">执行ID</span>
          <span class="detail-value-wrap">
            {{ displayValue(currentDetail.executionId) }}
            <el-button v-if="currentDetail.executionId" link type="primary" @click="copyText(currentDetail.executionId, '执行ID')">复制</el-button>
          </span>
        </div>
        <div class="detail-item"><span class="label">数据阶段</span><span>{{ stageLabelMap[currentDetail.dataStage] || displayValue(currentDetail.dataStage) }}</span></div>
        <div class="detail-item">
          <span class="label">数据状态</span>
          <span>
            <el-tag :type="statusTypeMap[currentDetail.dataStatus]" size="small" effect="light">
              {{ statusLabelMap[currentDetail.dataStatus] || '-' }}
            </el-tag>
          </span>
        </div>
        <div class="detail-item"><span class="label">数据标题</span><span>{{ displayValue(currentDetail.dataTitle) }}</span></div>
        <div class="detail-item"><span class="label">创建时间</span><span>{{ displayValue(currentDetail.createdAt) }}</span></div>
        <div class="detail-item"><span class="label">更新时间</span><span>{{ displayValue(currentDetail.updatedAt) }}</span></div>
        <div class="detail-item"><span class="label">删除标记</span><span>{{ currentDetail.deleted === 1 ? '已删除' : '未删除' }}</span></div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">
          <span>原始内容</span>
          <span class="detail-section__actions">
            <el-button
              v-if="isTextOverflow('rawContent')"
              link
              type="primary"
              @click="toggleSection('rawContent')"
            >{{ expanded.rawContent ? '收起' : '展开全部' }}</el-button>
            <el-button
              v-if="displayValue(currentDetail.rawContent) !== '-'"
              link
              type="primary"
              @click="copyText(displayValue(currentDetail.rawContent), '原始内容')"
            >复制</el-button>
          </span>
        </div>
        <pre class="detail-pre">{{ getDisplayText('rawContent') }}</pre>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">
          <span>修正内容</span>
          <span class="detail-section__actions">
            <el-button
              v-if="isTextOverflow('correctedContent')"
              link
              type="primary"
              @click="toggleSection('correctedContent')"
            >{{ expanded.correctedContent ? '收起' : '展开全部' }}</el-button>
            <el-button
              v-if="displayValue(currentDetail.correctedContent) !== '-'"
              link
              type="primary"
              @click="copyText(displayValue(currentDetail.correctedContent), '修正内容')"
            >复制</el-button>
          </span>
        </div>
        <pre class="detail-pre">{{ getDisplayText('correctedContent') }}</pre>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">
          <span>备注</span>
          <span class="detail-section__actions">
            <el-button
              v-if="isTextOverflow('remark')"
              link
              type="primary"
              @click="toggleSection('remark')"
            >{{ expanded.remark ? '收起' : '展开全部' }}</el-button>
            <el-button
              v-if="displayValue(currentDetail.remark) !== '-'"
              link
              type="primary"
              @click="copyText(displayValue(currentDetail.remark), '备注')"
            >复制</el-button>
          </span>
        </div>
        <pre class="detail-pre">{{ getDisplayText('remark') }}</pre>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteData, getDataByExecutionId, getDataDetail, getDataPage } from '../api/data'
import { formatLocalDateTime } from '../utils/datetime'

const route = useRoute()
const router = useRouter()

const searchForm = reactive({
  keyword: '',
  taskId: '',
  executionId: '',
  dataStatus: 'NORMAL',
  timeRange: []
})

const appliedSearch = reactive({
  keyword: '',
  taskId: '',
  executionId: '',
  dataStatus: 'NORMAL',
  timeRange: []
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const rows = ref([])
const detailVisible = ref(false)
const currentDetail = ref({})

const isExecutionMode = computed(() => !!String(appliedSearch.executionId || '').trim())

const statusTypeMap = {
  NORMAL: 'success',
  CORRECTED: 'warning',
  ERROR: 'danger',
  DELETED: 'info'
}

const stageLabelMap = {
  COLLECT: '采集',
  RESULT: '解析结果'
}

const PREVIEW_MAX = 500

const expanded = reactive({
  rawContent: false,
  correctedContent: false,
  remark: false
})

const statusLabelMap = {
  NORMAL: '正常',
  CORRECTED: '已修正',
  ERROR: '异常',
  DELETED: '已删除'
}

const normalizeStatus = (value) => {
  const v = String(value ?? '').trim().toUpperCase()
  if (!v) return ''
  if (v === 'NORMAL') return 'NORMAL'
  if (v === 'CORRECTED') return 'CORRECTED'
  if (v === 'ERROR') return 'ERROR'
  if (v === 'DELETED') return 'DELETED'
  return ''
}

const normalizeDataItem = (item = {}) => {
  const createdAtRaw = item.createdAt ?? item.created_at ?? item.createTime ?? item.collectTime ?? ''
  const updatedAtRaw = item.updatedAt ?? item.updated_at ?? item.updateTime ?? ''
  return {
    id: item.id ?? '',
    dataNo: item.dataNo ?? item.data_no ?? '',
    taskId: item.taskId ?? item.task_id ?? '',
    taskCode: item.taskCode ?? item.task_code ?? '',
    executionId: item.executionId ?? item.executionNo ?? item.execution_no ?? '',
    dataStage: item.dataStage ?? item.data_stage ?? '',
    dataStatus: normalizeStatus(item.dataStatus ?? item.data_status),
    dataTitle: item.dataTitle ?? '',
    createdAt: createdAtRaw ? formatLocalDateTime(createdAtRaw) : '',
    updatedAt: updatedAtRaw ? formatLocalDateTime(updatedAtRaw) : '',
    deleted: Number(item.deleted ?? 0),
    rawContent: item.rawContent ?? '',
    correctedContent: item.correctedContent ?? '',
    remark: item.remark ?? ''
  }
}

const tryFormatContent = (value) => {
  const text = displayValue(value)
  if (text === '-') return '-'
  const trimmed = String(text).trim()
  if (!trimmed) return '-'
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2)
    } catch {
      return text
    }
  }
  return text
}

const getTextByField = (field) => tryFormatContent(currentDetail.value?.[field])

const isTextOverflow = (field) => {
  const text = getTextByField(field)
  return text !== '-' && text.length > PREVIEW_MAX
}

const getDisplayText = (field) => {
  const text = getTextByField(field)
  if (text === '-') return '-'
  if (expanded[field] || text.length <= PREVIEW_MAX) return text
  return `${text.slice(0, PREVIEW_MAX)}\n...（内容较长，点击“展开全部”查看）`
}

const toggleSection = (field) => {
  expanded[field] = !expanded[field]
}

const extractErrorSummary = (text) => {
  const source = String(text ?? '')
  if (!source) return null
  const code = source.match(/(?:error\s*code|code)\s*[:：]?\s*([0-9]{3,})/i)?.[1] || ''
  const requestId = source.match(/request\s*id\s*[:：]?\s*([A-Za-z0-9_-]+)/i)?.[1] || ''
  const message = source.match(/message\s*[:：]?\s*['"“”]?([^'"”}\],\n]+)/i)?.[1] || ''
  if (!code && !requestId && !message) return null
  const parts = []
  if (code) parts.push(`错误码: ${code}`)
  if (message) parts.push(`错误信息: ${message}`)
  if (requestId) parts.push(`Request ID: ${requestId}`)
  return {
    title: '错误摘要',
    description: parts.join('；')
  }
}

const errorSummary = computed(() => {
  const status = currentDetail.value?.dataStatus
  if (status !== 'ERROR') return null
  return extractErrorSummary(currentDetail.value?.rawContent) || extractErrorSummary(currentDetail.value?.remark)
})

const indexMethod = (index) => (currentPage.value - 1) * pageSize.value + index + 1

const buildParams = () => {
  const range = Array.isArray(appliedSearch.timeRange) ? appliedSearch.timeRange : []
  return {
    page: currentPage.value,
    size: pageSize.value,
    keyword: appliedSearch.keyword || undefined,
    taskId: appliedSearch.taskId || undefined,
    executionId: appliedSearch.executionId || undefined,
    dataStatus: appliedSearch.dataStatus || undefined,
    createdFrom: range[0] ? formatLocalDateTime(range[0]).replace(' ', 'T') : undefined,
    createdTo: range[1] ? formatLocalDateTime(range[1]).replace(' ', 'T') : undefined
  }
}

const loadRows = async () => {
  loading.value = true
  try {
    const executionId = String(appliedSearch.executionId || '').trim()
    const res = executionId
      ? await getDataByExecutionId(executionId, {
          page: currentPage.value,
          size: pageSize.value,
          dataStatus: appliedSearch.dataStatus || undefined
        })
      : await getDataPage(buildParams())
    rows.value = Array.isArray(res.list) ? res.list.map((item) => normalizeDataItem(item)) : []
    total.value = res.total
  } catch (error) {
    rows.value = []
    total.value = 0
    ElMessage.error(error?.response?.data?.message || error?.message || '加载查询数据失败')
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  appliedSearch.keyword = searchForm.keyword
  appliedSearch.taskId = searchForm.taskId
  appliedSearch.executionId = searchForm.executionId
  appliedSearch.dataStatus = searchForm.dataStatus
  appliedSearch.timeRange = Array.isArray(searchForm.timeRange) ? [...searchForm.timeRange] : []
  currentPage.value = 1
  loadRows()
}

const onReset = () => {
  searchForm.keyword = ''
  searchForm.taskId = ''
  searchForm.executionId = ''
  searchForm.dataStatus = 'NORMAL'
  searchForm.timeRange = []

  appliedSearch.keyword = ''
  appliedSearch.taskId = ''
  appliedSearch.executionId = ''
  appliedSearch.dataStatus = 'NORMAL'
  appliedSearch.timeRange = []
  currentPage.value = 1

  if (route.query.executionId) {
    const query = { ...route.query }
    delete query.executionId
    router.replace({ path: '/data/query', query })
  }

  loadRows()
}

const clearExecutionFilter = () => {
  searchForm.executionId = ''
  appliedSearch.executionId = ''
  currentPage.value = 1
  const query = { ...route.query }
  delete query.executionId
  router.replace({ path: '/data/query', query })
  loadRows()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  loadRows()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadRows()
}

const goTaskDetail = (taskId) => {
  if (!taskId) return
  router.push({ path: '/task/list', query: { taskId } })
}

const displayValue = (value) => {
  if (value === 0) return '0'
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

const openDetail = async (id) => {
  // [修复] 详情统一通过 getDataDetail(id) 获取
  if (!id) return
  try {
    const detail = await getDataDetail(id)
    currentDetail.value = normalizeDataItem(detail)
    expanded.rawContent = false
    expanded.correctedContent = false
    expanded.remark = false
    detailVisible.value = true
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error?.message || '加载详情失败')
  }
}

const closeDetail = () => {
  expanded.rawContent = false
  expanded.correctedContent = false
  expanded.remark = false
  detailVisible.value = false
  currentDetail.value = {}
}

const copyText = async (value, label = '内容') => {
  const text = String(value ?? '').trim()
  if (!text || text === '-') return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(`${label}已复制`)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success(`${label}已复制`)
  }
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该记录吗？', '提示', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' })
    await deleteData(row.id)
    ElMessage.success('删除成功')
    loadRows()
  } catch {}
}

const applyQuery = () => {
  const taskId = typeof route.query.taskId === 'string' ? route.query.taskId : ''
  const executionId = typeof route.query.executionId === 'string' ? route.query.executionId : ''

  searchForm.taskId = taskId
  appliedSearch.taskId = taskId
  searchForm.executionId = executionId
  appliedSearch.executionId = executionId
  currentPage.value = 1

  loadRows()
}

watch(
  () => [route.query.taskId, route.query.executionId],
  () => applyQuery()
)

onMounted(() => {
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

.execution-alert {
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

.detail-alert {
  margin-bottom: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border: 1px solid #ebeef5;
}

.detail-item {
  display: grid;
  grid-template-columns: 150px 1fr;
  min-height: 44px;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
}

.detail-item:nth-child(2n) {
  border-right: none;
}

.detail-item .label {
  padding: 10px 12px;
  background: #f5f7fa;
  color: #606266;
  font-weight: 600;
  border-right: 1px solid #ebeef5;
}

.detail-item > span:last-child {
  padding: 10px 12px;
  color: #303133;
  display: flex;
  align-items: center;
}

.detail-value-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.detail-section {
  margin-top: 16px;
}

.detail-section__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #606266;
  font-weight: 600;
  margin-bottom: 10px;
}

.detail-section__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  background: #f8fafc;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 12px;
  color: #303133;
  max-height: 260px;
  overflow: auto;
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












