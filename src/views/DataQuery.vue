<template>
  <div class="data-query-page">
    <div class="page-header">
      <div>
        <div class="page-title">数据查询</div>
        <div class="page-subtitle">左侧数据表格，右侧 Drawer 以通用 JSON 视图展示详情</div>
      </div>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键字">
          <el-input
            v-model="searchForm.keyword"
            placeholder="数据编号 / 标题 / 内容关键字"
            clearable
            style="width: 240px"
            @keyup.enter="onSearch"
          />
        </el-form-item>
        <el-form-item label="任务ID">
          <el-input
            v-model="searchForm.taskId"
            placeholder="请输入任务ID"
            clearable
            style="width: 180px"
            @keyup.enter="onSearch"
          />
        </el-form-item>
        <el-form-item label="执行ID">
          <el-input
            v-model="searchForm.executionId"
            placeholder="请输入执行ID"
            clearable
            style="width: 180px"
            @keyup.enter="onSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 160px">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="searchForm.createdRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            clearable
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table
        :data="rows"
        v-loading="loading"
        class="data-table"
        stripe
        @row-click="handleRowClick"
      >
        <el-table-column type="index" label="序号" width="70" align="center" :index="indexMethod" />
        <el-table-column prop="dataCode" label="数据编号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="taskId" label="任务ID" min-width="160" show-overflow-tooltip />
        <el-table-column prop="executionId" label="执行ID" min-width="180" show-overflow-tooltip />
        <el-table-column prop="dataTitle" label="数据标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="dataStatus" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.dataStatus).type" effect="light" round>
              {{ statusMeta(row.dataStatus).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-tooltip content="查看详情" placement="top">
              <el-button circle plain type="primary" @click.stop="openDetail(row)">
                <el-icon><View /></el-icon>
              </el-button>
            </el-tooltip>
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

    <el-drawer
      v-model="drawerVisible"
      size="40%"
      direction="rtl"
      append-to-body
      destroy-on-close
      class="detail-drawer"
    >
      <template #header>
        <div class="drawer-header">
          <div>
            <div class="drawer-title">{{ detailTitle }}</div>
            <div class="drawer-subtitle">通用 JSON 数据详情</div>
          </div>
          <el-tag :type="statusMeta(currentDetail.dataStatus).type" effect="light" round class="drawer-status-tag">
            {{ statusMeta(currentDetail.dataStatus).label }}
          </el-tag>
        </div>
      </template>

      <div class="drawer-body" v-loading="detailLoading">
        <div class="drawer-view-switcher">
          <el-segmented v-model="activePanel" :options="panelOptions" block />
        </div>

        <el-card v-if="activePanel === 'structured'" shadow="never" class="detail-section-card panel-card structured-card">
            <template #header>
              <div class="section-header">
                <div class="section-title">结构化数据</div>
                <div class="section-desc">以表格形式展示 JSON 内容</div>
              </div>
            </template>

            <div v-if="structuredSections.length" class="structured-section-list">
              <div v-for="section in structuredSections" :key="section.key" class="structured-section">
                <div class="structured-section__head">
                  <span class="structured-section__title">{{ section.key }}</span>
                  <el-tag v-if="section.badge" size="small" effect="plain" round>{{ section.badge }}</el-tag>
                </div>

                <div v-if="section.type === 'object'" class="structured-table">
                  <div class="structured-table__header structured-table__row">
                    <div>Key</div>
                    <div>Value</div>
                  </div>
                  <div v-for="item in section.children" :key="`${section.key}-${item.key}`" class="structured-table__row">
                    <div class="structured-table__key">{{ item.key }}</div>
                    <div class="structured-table__value">{{ item.value }}</div>
                  </div>
                </div>

                <div v-else-if="section.type === 'array'" class="array-section-list">
                  <div v-for="item in section.children" :key="item.title" class="array-section-card">
                    <div class="array-section-card__title">{{ item.title }}</div>
                    <div class="structured-table">
                      <div class="structured-table__header structured-table__row">
                        <div>Key</div>
                        <div>Value</div>
                      </div>
                      <div v-for="field in item.fields" :key="`${item.title}-${field.key}`" class="structured-table__row">
                        <div class="structured-table__key">{{ field.key }}</div>
                        <div class="structured-table__value">{{ field.value }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="primitive-box">{{ section.value }}</div>
              </div>
            </div>

            <div v-else class="text-fallback">
              <div class="text-fallback__label">内容</div>
              <div class="text-fallback__value">{{ textContent }}</div>
            </div>
          </el-card>

          <el-card v-else shadow="never" class="detail-section-card panel-card raw-card">
            <template #header>
              <div class="section-header section-header--row">
                <div>
                  <div class="section-title">原始 JSON</div>
                  <div class="section-desc">格式化展示原始 JSON，提升可读性</div>
                </div>
                <el-button type="primary" plain @click="copyRawJson">复制</el-button>
              </div>
            </template>

            <div class="raw-panel raw-panel--enhanced">
              <div v-if="rawJsonLines.length" class="code-viewer">
                <div v-for="(line, index) in rawJsonLines" :key="index" class="code-line">
                  <span class="code-line__number">{{ index + 1 }}</span>
                  <code class="code-line__content" v-html="line"></code>
                </div>
              </div>
              <div v-else class="text-fallback">
                <div class="text-fallback__label">内容</div>
                <div class="text-fallback__value">{{ textContent }}</div>
              </div>
            </div>
          </el-card>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { View } from '@element-plus/icons-vue'
import { getDataDetail, getDataPage } from '../api/data'
import { formatLocalDateTime } from '../utils/datetime'

const searchForm = reactive({
  keyword: '',
  taskId: '',
  executionId: '',
  status: '',
  createdRange: []
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const detailLoading = ref(false)
const rows = ref([])
const drawerVisible = ref(false)
const activePanel = ref('structured')
const currentDetail = ref({})

const panelOptions = [
  { label: '结构化数据', value: 'structured' },
  { label: '原始 JSON', value: 'raw' }
]

const statusOptions = [
  { label: '成功', value: 'NORMAL' },
  { label: '处理中', value: 'CORRECTED' },
  { label: '失败', value: 'ERROR' }
]

const statusAliasMap = {
  NORMAL: 'SUCCESS',
  SUCCESS: 'SUCCESS',
  COMPLETED: 'SUCCESS',
  CORRECTED: 'PROCESSING',
  PROCESSING: 'PROCESSING',
  RUNNING: 'PROCESSING',
  PENDING: 'PROCESSING',
  ERROR: 'FAILED',
  FAILED: 'FAILED',
  DELETED: 'FAILED'
}

const statusConfig = {
  SUCCESS: { label: '成功', type: 'success' },
  FAILED: { label: '失败', type: 'danger' },
  PROCESSING: { label: '处理中', type: 'warning' },
  UNKNOWN: { label: '未知', type: 'info' }
}

const normalizeStatus = (value) => {
  const key = String(value ?? '').trim().toUpperCase()
  return statusAliasMap[key] || 'UNKNOWN'
}

const statusMeta = (value) => statusConfig[normalizeStatus(value)] || statusConfig.UNKNOWN

const displayValue = (value) => {
  if (value === 0) return '0'
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

const parseMaybeJson = (value) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'object') return value
  const text = String(value).trim()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const tryExtractJsonString = (value) => {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text) return null

  const firstObjectIndex = text.indexOf('{')
  const lastObjectIndex = text.lastIndexOf('}')
  if (firstObjectIndex !== -1 && lastObjectIndex > firstObjectIndex) {
    const objectText = text.slice(firstObjectIndex, lastObjectIndex + 1)
    try {
      return JSON.parse(objectText)
    } catch {
      // ignore
    }
  }

  const firstArrayIndex = text.indexOf('[')
  const lastArrayIndex = text.lastIndexOf(']')
  if (firstArrayIndex !== -1 && lastArrayIndex > firstArrayIndex) {
    const arrayText = text.slice(firstArrayIndex, lastArrayIndex + 1)
    try {
      return JSON.parse(arrayText)
    } catch {
      // ignore
    }
  }

  return null
}

const normalizeDataItem = (item = {}) => {
  const createdAtRaw = item.createdAt ?? item.created_at ?? item.createTime ?? item.collectTime ?? ''
  const updatedAtRaw = item.updatedAt ?? item.updated_at ?? item.updateTime ?? item.modifiedTime ?? ''
  const rawContent = item.rawContent ?? item.content ?? item.raw_data ?? item.dataContent ?? item.result ?? ''
  const parsedContent = parseMaybeJson(rawContent) ?? tryExtractJsonString(rawContent)

  return {
    id: item.id ?? item.dataId ?? '',
    dataCode: item.dataCode ?? item.dataNo ?? item.data_no ?? item.code ?? '',
    taskId: item.taskId ?? item.task_id ?? '',
    executionId: item.executionId ?? item.executionNo ?? item.execution_no ?? '',
    dataStatus: normalizeStatus(item.dataStatus ?? item.data_status ?? item.status),
    dataTitle: item.dataTitle ?? item.title ?? '',
    createdAt: createdAtRaw ? formatLocalDateTime(createdAtRaw) : '',
    updatedAt: updatedAtRaw ? formatLocalDateTime(updatedAtRaw) : '',
    rawContent,
    parsedContent
  }
}

const detailTitle = computed(() => displayValue(currentDetail.value.dataCode || currentDetail.value.id || '数据详情'))

const structuredJsonData = computed(() => currentDetail.value.parsedContent)
const textContent = computed(() => displayValue(currentDetail.value.rawContent))

const formatStructuredValue = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  if (Array.isArray(value)) return `${value.length} 项`
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const toFieldList = (obj = {}) => Object.entries(obj).map(([key, value]) => ({
  key,
  value: formatStructuredValue(value)
}))

const structuredSections = computed(() => {
  const source = structuredJsonData.value
  if (!source) return []

  if (Array.isArray(source)) {
    return [{
      key: 'root',
      type: 'array',
      badge: `${source.length} 项`,
      children: source.map((item, index) => ({
        title: `Item ${index + 1}`,
        fields: typeof item === 'object' && item !== null
          ? toFieldList(item)
          : [{ key: 'value', value: formatStructuredValue(item) }]
      }))
    }]
  }

  if (typeof source !== 'object') {
    return [{ key: 'root', type: 'primitive', value: formatStructuredValue(source) }]
  }

  return Object.entries(source).map(([key, value]) => {
    if (Array.isArray(value)) {
      return {
        key,
        type: 'array',
        badge: `${value.length} 项`,
        children: value.map((item, index) => ({
          title: `Item ${index + 1}`,
          fields: typeof item === 'object' && item !== null
            ? toFieldList(item)
            : [{ key: 'value', value: formatStructuredValue(item) }]
        }))
      }
    }

    if (value && typeof value === 'object') {
      return {
        key,
        type: 'object',
        children: toFieldList(value)
      }
    }

    return {
      key,
      type: 'primitive',
      value: formatStructuredValue(value)
    }
  })
})

const rawJsonText = computed(() => {
  const source = structuredJsonData.value
  if (source !== null) return JSON.stringify(source, null, 2)
  return textContent.value
})

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const syntaxHighlight = (json) => escapeHtml(json).replace(
  /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"\s*:?)|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
  (match) => {
    if (/^".*":$/.test(match)) return `<span class="token token-key">${match}</span>`
    if (/^"/.test(match)) return `<span class="token token-string">${match}</span>`
    if (/true|false/.test(match)) return `<span class="token token-boolean">${match}</span>`
    if (/null/.test(match)) return `<span class="token token-null">${match}</span>`
    return `<span class="token token-number">${match}</span>`
  }
)

const rawJsonLines = computed(() => {
  const content = rawJsonText.value
  if (!content || content === '-') return []
  return syntaxHighlight(content).split('\n')
})

const indexMethod = (index) => (currentPage.value - 1) * pageSize.value + index + 1

const buildParams = () => ({
  page: currentPage.value,
  size: pageSize.value,
  keyword: searchForm.keyword || undefined,
  taskId: searchForm.taskId || undefined,
  executionId: searchForm.executionId || undefined,
  dataStatus: searchForm.status || undefined,
  createdFrom: searchForm.createdRange?.[0] || undefined,
  createdTo: searchForm.createdRange?.[1] || undefined
})

const loadRows = async () => {
  loading.value = true
  try {
    const res = await getDataPage(buildParams())
    rows.value = Array.isArray(res.list) ? res.list.map(normalizeDataItem) : []
    total.value = Number(res.total) || 0
  } catch (error) {
    rows.value = []
    total.value = 0
    ElMessage.error(error?.response?.data?.message || error?.message || '加载数据列表失败')
  } finally {
    loading.value = false
  }
}

const openDetail = async (row) => {
  activePanel.value = 'structured'
  drawerVisible.value = true
  currentDetail.value = normalizeDataItem(row || {})

  if (!row?.id) return

  detailLoading.value = true
  try {
    const detail = await getDataDetail(row.id)
    currentDetail.value = normalizeDataItem(detail)
  } catch (error) {
    currentDetail.value = normalizeDataItem(row)
    ElMessage.warning(error?.response?.data?.message || error?.message || '详情接口不可用，已展示当前行数据')
  } finally {
    detailLoading.value = false
  }
}

const copyRawJson = async () => {
  try {
    await navigator.clipboard.writeText(rawJsonText.value)
    ElMessage.success('JSON 已复制')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

const handleRowClick = (row) => {
  openDetail(row)
}

const onSearch = () => {
  currentPage.value = 1
  loadRows()
}

const onReset = () => {
  searchForm.keyword = ''
  searchForm.taskId = ''
  searchForm.executionId = ''
  searchForm.status = ''
  searchForm.createdRange = []
  currentPage.value = 1
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

onMounted(() => {
  loadRows()
})
</script>

<style scoped>
.data-query-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 22px;
  line-height: 1.2;
  font-weight: 700;
  color: #1f2937;
}

.page-subtitle {
  margin-top: 6px;
  color: #6b7280;
  font-size: 13px;
}

.filter-card,
.table-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-bottom: -18px;
}

.data-table {
  --el-table-row-hover-bg-color: #f8fbff;
}

.data-table :deep(.el-table__row) {
  cursor: pointer;
}

.data-table :deep(th.el-table__cell) {
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.drawer-header {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.drawer-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.drawer-subtitle {
  font-size: 12px;
  color: #6b7280;
}

.drawer-status-tag {
  margin-top: 4px;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.detail-drawer :deep(.el-drawer__body) {
  overflow-y: auto;
  padding: 0 24px 24px;
}

.drawer-view-switcher {
  display: flex;
  justify-content: flex-start;
}

.drawer-view-switcher :deep(.el-segmented) {
  padding: 4px;
  border-radius: 14px;
  background: #f8fafc;
}

.drawer-view-switcher :deep(.el-segmented__item) {
  min-width: 120px;
  font-weight: 600;
}

.detail-section-card {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #e8edf5;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.panel-card {
  padding: 16px;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-header--row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
}

.section-desc {
  color: #94a3b8;
  font-size: 12px;
}

.structured-card,
.raw-card {
  display: flex;
  flex-direction: column;
}

.structured-section-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.structured-section {
  border: 1px solid #e8edf5;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
}

.structured-section__head {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #fbfcfe;
  border-bottom: 1px solid #eef2f7;
}

.structured-section__title {
  color: #0f172a;
  font-weight: 700;
}

.structured-table {
  border-top: none;
}

.structured-table__row {
  display: grid;
  grid-template-columns: 140px 1fr;
}

.structured-table__header {
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.structured-table__row > div {
  padding: 10px 12px;
  border-bottom: 1px solid #eef2f7;
}

.structured-table__row:last-child > div {
  border-bottom: none;
}

.structured-table__key {
  color: #334155;
  background: #fcfdff;
  word-break: break-word;
}

.structured-table__value {
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
}

.array-section-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.array-section-card {
  border: 1px solid #eef2f7;
  border-radius: 12px;
  overflow: hidden;
}

.array-section-card__title {
  padding: 10px 12px;
  background: #f8fafc;
  color: #334155;
  font-weight: 600;
  border-bottom: 1px solid #eef2f7;
}

.primitive-box {
  padding: 14px 16px;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
}

.raw-panel {
  height: auto;
}

.text-fallback {
  border: 1px solid #e8edf5;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.text-fallback__label {
  padding: 14px 16px;
  font-weight: 600;
  color: #0f172a;
  border-bottom: 1px solid #eef2f7;
  background: #fbfcfe;
}

.text-fallback__value {
  padding: 16px;
  color: #334155;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.raw-panel--enhanced {
  overflow: visible;
}

.code-viewer {
  border: 1px solid #e8edf5;
  border-radius: 16px;
  background: #ffffff;
  overflow: hidden;
}

.code-line {
  display: grid;
  grid-template-columns: 52px 1fr;
  min-height: 28px;
}

.code-line:nth-child(odd) {
  background: #fcfdff;
}

.code-line__number {
  padding: 0 12px;
  color: #94a3b8;
  background: #f8fafc;
  border-right: 1px solid #edf2f7;
  text-align: right;
  line-height: 28px;
  user-select: none;
}

.code-line__content {
  padding: 0 16px;
  color: #0f172a;
  line-height: 28px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.code-line__content :deep(.token-key) {
  color: #dc2626;
}

.code-line__content :deep(.token-string) {
  color: #2563eb;
}

.code-line__content :deep(.token-number) {
  color: #0f766e;
}

.code-line__content :deep(.token-boolean) {
  color: #7c3aed;
}

.code-line__content :deep(.token-null) {
  color: #64748b;
}

@media (max-width: 768px) {
  .drawer-header,
  .section-header--row {
    flex-direction: column;
    align-items: flex-start;
  }

  .structured-table__row {
    grid-template-columns: 1fr;
  }
}
</style>























