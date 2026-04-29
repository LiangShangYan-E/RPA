<template>
  <div class="data-view">
    <div class="page-title">数据查询</div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-value text-black">{{ totalCount }}</div>
        <div class="stat-label">总采集数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-green">{{ successCount }}</div>
        <div class="stat-label">成功</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-orange">{{ failedCount }}</div>
        <div class="stat-label">失败</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-red">{{ unknownCount }}</div>
        <div class="stat-label">未知</div>
      </div>
    </div>

    <el-card shadow="never" class="content-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键字:">
          <el-input v-model="searchForm.keyword" placeholder="数据编号/任务ID/标题/内容" clearable style="width: 260px" />
        </el-form-item>
        <el-form-item label="任务ID:">
          <el-input v-model="searchForm.taskId" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="状态:">
          <el-select v-model="searchForm.dataStatus" placeholder="请选择" clearable style="width: 150px">
            <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
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

      <div class="collect-layout" :class="{ 'has-detail': hasDetail }">
        <div ref="collectLeftRef" class="collect-left">
          <el-table :data="visibleRows" v-loading="loading" stripe class="data-table">
            <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" />
            <el-table-column prop="dataNo" label="数据编号" min-width="180" show-overflow-tooltip />
            <el-table-column prop="taskId" label="任务ID" width="120" />
            <el-table-column prop="taskCode" label="任务编码" min-width="170" show-overflow-tooltip />
            <el-table-column prop="dataStage" label="数据阶段" width="120" align="center">
              <template #default="{ row }">
                {{ stageLabelMap[row.dataStage] || row.dataStage || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="dataTitle" label="数据标题" min-width="220" show-overflow-tooltip />
            <el-table-column prop="dataStatus" label="状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="statusTypeMap[row.crawlStatus]" size="small" effect="light">
                  {{ statusLabelMap[row.crawlStatus] || '-' }}
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
        </div>

        <div v-if="hasDetail" class="collect-right" :style="rightPanelStyle">
          <el-card shadow="never" class="detail-card">
            <div class="detail-card__header">
              <div class="section-title">详情展示</div>
              <div class="detail-actions">
                <el-radio-group v-model="displayMode" size="small">
                  <el-radio-button label="table">表格</el-radio-button>
                  <el-radio-button label="json">JSON</el-radio-button>
                </el-radio-group>
                <el-button size="small" @click="closeDetail">关闭</el-button>
              </div>
            </div>

            <div class="detail-content">
              <div class="detail-meta">
                <div class="meta-item"><span class="label">数据编号</span><span>{{ displayValue(currentDetail.dataNo) }}</span></div>
                <div class="meta-item"><span class="label">任务ID</span><span>{{ displayValue(currentDetail.taskId) }}</span></div>
                <div class="meta-item"><span class="label">创建时间</span><span>{{ displayValue(currentDetail.createdAt) }}</span></div>
                <div class="meta-item"><span class="label">爬取结果</span>
                  <span>
                    <el-tag v-if="isDone === true" type="success" size="small" effect="light">成功</el-tag>
                    <el-tag v-else-if="isDone === false" type="danger" size="small" effect="light">失败</el-tag>
                    <span v-else>-</span>
                  </span>
                </div>
              </div>

              <div class="detail-block">
                <div class="detail-block__title">
                  <span>字段: {{ displayKey || '-' }}</span>
                </div>

                <div v-if="displayMode === 'table'" class="detail-block__body">
                  <el-table
                    :data="displayRows"
                    v-loading="detailLoading"
                    stripe
                    height="100%"
                    class="detail-table"
                  >
                    <el-table-column
                      v-for="col in displayColumns"
                      :key="col"
                      :prop="col"
                      :label="col"
                      min-width="140"
                      show-overflow-tooltip
                    />
                  </el-table>
                  <el-empty v-if="isDone === false" description="爬取失败，暂无可展示内容" />
                  <el-empty v-else-if="!displayColumns.length" description="没有可展示的数组字段" />
                </div>
                <div v-else class="detail-block__body">
                  <pre v-if="isDone === false" class="json-pre">爬取失败，暂无可展示内容</pre>
                  <pre v-else class="json-pre">{{ jsonDisplay }}</pre>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="createVisible" title="新增采集数据" width="760px" :close-on-click-modal="false">
      <el-form :model="createForm" label-width="110px">
        <el-form-item label="执行ID" required>
          <el-input v-model="createForm.executionId" placeholder="如 EXEC_TEST_001" />
        </el-form-item>
        <el-form-item label="任务ID">
          <el-input v-model="createForm.taskId" placeholder="请输入任务ID" />
        </el-form-item>
        <el-form-item label="数据标题" required>
          <el-input v-model="createForm.dataTitle" placeholder="请输入数据标题" />
        </el-form-item>
        <el-form-item label="原始内容" required>
          <el-input v-model="createForm.rawContent" type="textarea" :rows="4" placeholder="请输入原始内容" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="onCreate">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createData, deleteData, getDataDetail, getDataPage } from '../../api/data'
import { formatLocalDateTime } from '../../utils/datetime'

const DATA_STAGE = 'COLLECT'

const searchForm = reactive({
  keyword: '',
  taskId: '',
  dataStatus: '',
  timeRange: []
})

const appliedSearch = reactive({
  keyword: '',
  taskId: '',
  dataStatus: '',
  timeRange: []
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const rows = ref([])
const detailLoading = ref(false)
const currentDetail = ref({})
const displayMode = ref('table')
const collectLeftRef = ref(null)
const rightPanelHeight = ref(0)
let leftResizeObserver

const createVisible = ref(false)
const createLoading = ref(false)
const createForm = reactive({
  executionId: '',
  taskId: '',
  dataTitle: '',
  rawContent: '',
  remark: ''
})

const statusOptions = [
  { label: '成功', value: 'SUCCESS' },
  { label: '失败', value: 'FAILED' },
  { label: '未知', value: 'UNKNOWN' }
]
const statusTypeMap = { NORMAL: 'success', CORRECTED: 'warning', ERROR: 'danger', DELETED: 'info', SUCCESS: 'success', FAILED: 'danger' }
const statusLabelMap = { NORMAL: '正常', CORRECTED: '已修正', ERROR: '异常', DELETED: '已删除', SUCCESS: '成功', FAILED: '失败' }
const stageLabelMap = { COLLECT: '采集', RESULT: '解析结果' }

const normalizeStatus = (value) => {
  const v = String(value ?? '').trim().toUpperCase()
  if (!v) return ''
  if (v === 'NORMAL') return 'NORMAL'
  if (v === 'CORRECTED') return 'CORRECTED'
  if (v === 'ERROR') return 'ERROR'
  if (v === 'DELETED') return 'DELETED'
  return ''
}

const normalizeStage = (value) => {
  const v = String(value ?? '').trim().toUpperCase()
  if (v === 'COLLECT') return 'COLLECT'
  if (v === 'RESULT') return 'RESULT'
  return DATA_STAGE
}

const normalizeDataItem = (item = {}) => {
  const createdAtRaw =
    item.createdAt ??
    item.created_at ??
    item.createTime ??
    item.collectTime ??
    ''

  const updatedAtRaw =
    item.updatedAt ??
    item.updated_at ??
    item.updateTime ??
    ''

  const isDoneValue = resolveIsDone(item)

  return {
    id: item.id ?? '',
    dataNo: item.dataNo ?? item.data_no ?? '',
    taskId: item.taskId ?? item.task_id ?? '',
    taskCode: item.taskCode ?? item.task_code ?? '',
    executionId: item.executionId ?? item.execution_no ?? item.executionNo ?? '',
    dataStage: normalizeStage(item.dataStage ?? item.data_stage),
    dataTitle: item.dataTitle ?? '',
    dataStatus: normalizeStatus(item.dataStatus),
    crawlStatus: isDoneValue === true ? 'SUCCESS' : isDoneValue === false ? 'FAILED' : '',
    createdAt: createdAtRaw ? formatLocalDateTime(createdAtRaw) : '',
    updatedAt: updatedAtRaw ? formatLocalDateTime(updatedAtRaw) : '',
    deleted: Number(item.deleted ?? 0),
    rawContent: item.rawContent ?? ''
  }
}

const displayValue = (value) => {
  if (value === 0) return '0'
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

const parseIsDoneValue = (raw) => {
  if (raw === true || raw === false) return raw
  if (raw === 1 || raw === 0) return raw === 1
  const rawText = String(raw ?? '').trim()
  if (!rawText) return null
  const lower = rawText.toLowerCase()
  if (lower === 'true' || lower === 'false') return lower === 'true'
  if (lower === '1' || lower === '0') return lower === '1'
  const doneMatch = rawText.match(/is_done\s*[:=]\s*(True|False|true|false)/)
  if (!doneMatch) return null
  return doneMatch[1].toLowerCase() === 'true'
}

const resolveIsDone = (item = {}) => {
  const direct = parseIsDoneValue(item.isDone ?? item.is_done)
  if (direct !== null) return direct
  return parseIsDoneValue(
    item.contentSummary ??
    item.content_summary ??
    item.displayContent ??
    item.display_content ??
    item.rawContent ??
    item.raw_content
  )
}

const parseExtractedContent = (raw) => {
  if (!raw) return { data: null, jsonText: '', isDone: null }
  const rawText = String(raw)

  try {
    const data = JSON.parse(rawText)
    return { data, jsonText: JSON.stringify(data, null, 2), isDone: null }
  } catch {}

  const doneMatch = rawText.match(/is_done\s*=\s*(True|False|true|false)/)
  const isDone = doneMatch ? doneMatch[1].toLowerCase() === 'true' : null
  const match = rawText.match(/extracted_content='([^']*)'|extracted_content="([^"]*)"/)
  if (match) {
    const captured = match[1] || match[2] || ''
    const unescaped = captured
      .replace(/\\/g, '\\')
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
    try {
      const data = JSON.parse(unescaped)
      return { data, jsonText: JSON.stringify(data, null, 2), isDone }
    } catch {
      return { data: null, jsonText: unescaped, isDone }
    }
  }

  return { data: null, jsonText: rawText, isDone }
}

const getDetailContentText = (detail = {}) =>
  detail.contentSummary ??
  detail.displayContent ??
  detail.rawContent ??
  detail.raw_content ??
  ''

const extractedContent = computed(() => parseExtractedContent(getDetailContentText(currentDetail.value)))
const isDone = computed(() => extractedContent.value.isDone)

const extractedArrayInfo = computed(() => {
  if (isDone.value === false) return { key: '', value: [] }
  const data = extractedContent.value.data
  if (Array.isArray(data)) return { key: 'items', value: data }
  if (data && typeof data === 'object') {
    const entries = Object.entries(data).filter(([, value]) => Array.isArray(value))
    const nonEmpty = entries.find(([, value]) => value.length > 0)
    if (nonEmpty) return { key: nonEmpty[0], value: nonEmpty[1] }
    if (entries.length) return { key: entries[0][0], value: entries[0][1] }
  }
  return { key: '', value: [] }
})

const displayKey = computed(() => extractedArrayInfo.value.key)
const hasDetail = computed(() => Boolean(currentDetail.value.id))
const rightPanelStyle = computed(() => (rightPanelHeight.value ? { height: `${rightPanelHeight.value}px` } : {}))

const displayRows = computed(() => {
  const value = extractedArrayInfo.value.value
  if (!Array.isArray(value) || value.length === 0) return []
  const isPlainObject = (item) => item && typeof item === 'object' && !Array.isArray(item)
  if (value.every(isPlainObject)) return value
  return value.map((item) => ({ value: item }))
})

const displayColumns = computed(() => {
  const first = displayRows.value[0]
  if (!first) return []
  return Object.keys(first)
})

const jsonDisplay = computed(() => {
  if (!displayKey.value) return ''
  return JSON.stringify({ [displayKey.value]: extractedArrayInfo.value.value }, null, 2)
})

const visibleRows = computed(() => {
  const status = appliedSearch.dataStatus
  if (!status) return rows.value
  if (status === 'UNKNOWN') return rows.value.filter((r) => !r.crawlStatus)
  return rows.value.filter((r) => r.crawlStatus === status)
})

const totalCount = computed(() => rows.value.length)
const successCount = computed(() => rows.value.filter((r) => r.crawlStatus === 'SUCCESS').length)
const failedCount = computed(() => rows.value.filter((r) => r.crawlStatus === 'FAILED').length)
const unknownCount = computed(() => rows.value.filter((r) => !r.crawlStatus).length)

const indexMethod = (index) => (currentPage.value - 1) * pageSize.value + index + 1

const buildParams = () => {
  const range = Array.isArray(appliedSearch.timeRange) ? appliedSearch.timeRange : []
  return {
    page: currentPage.value,
    size: pageSize.value,
    dataStage: DATA_STAGE,
    keyword: appliedSearch.keyword || undefined,
    taskId: appliedSearch.taskId || undefined,
    dataStatus: undefined,
    createdFrom: range[0] ? formatLocalDateTime(range[0]).replace(' ', 'T') : undefined,
    createdTo: range[1] ? formatLocalDateTime(range[1]).replace(' ', 'T') : undefined
  }
}

const loadRows = async () => {
  loading.value = true
  try {
    const res = await getDataPage(buildParams())
    rows.value = Array.isArray(res.list) ? res.list.map((item) => normalizeDataItem(item)) : []
    total.value = res.total
  } catch (error) {
    rows.value = []
    total.value = 0
    ElMessage.error(error?.response?.data?.message || error?.message || '加载采集数据失败')
  } finally {
    loading.value = false
    nextTick(updateRightPanelHeight)
  }
}

const onSearch = () => {
  appliedSearch.keyword = searchForm.keyword
  appliedSearch.taskId = searchForm.taskId
  appliedSearch.dataStatus = searchForm.dataStatus
  appliedSearch.timeRange = Array.isArray(searchForm.timeRange) ? [...searchForm.timeRange] : []
  currentPage.value = 1
  loadRows()
}

const onReset = () => {
  searchForm.keyword = ''
  searchForm.taskId = ''
  searchForm.dataStatus = ''
  searchForm.timeRange = []
  appliedSearch.keyword = ''
  appliedSearch.taskId = ''
  appliedSearch.dataStatus = ''
  appliedSearch.timeRange = []
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

const openDetail = async (id) => {
  if (!id) return
  detailLoading.value = true
  try {
    const detail = await getDataDetail(id)
    console.log('[DataCollect] getDataDetail response:', detail)
    currentDetail.value = normalizeDataItem(detail)
    nextTick(updateRightPanelHeight)
  } catch (error) {
    currentDetail.value = {}
    ElMessage.error(error?.response?.data?.message || error?.message || '加载详情失败')
  } finally {
    detailLoading.value = false
  }
}

const closeDetail = () => {
  currentDetail.value = {}
}

const updateRightPanelHeight = () => {
  if (!collectLeftRef.value) return
  const rect = collectLeftRef.value.getBoundingClientRect()
  rightPanelHeight.value = Math.max(0, Math.floor(rect.height))
}

watch(hasDetail, () => nextTick(updateRightPanelHeight))

const onCreate = async () => {
  if (!createForm.executionId || !createForm.dataTitle || !createForm.rawContent) {
    ElMessage.warning('请填写执行ID、数据标题、原始内容')
    return
  }
  createLoading.value = true
  try {
    await createData({
      executionId: createForm.executionId,
      taskId: createForm.taskId ? Number(createForm.taskId) : undefined,
      dataStage: DATA_STAGE,
      dataStatus: 'NORMAL',
      dataTitle: createForm.dataTitle,
      rawContent: createForm.rawContent,
      remark: createForm.remark || undefined
    })
    ElMessage.success('新增成功')
    createVisible.value = false
    loadRows()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error?.message || '新增失败')
  } finally {
    createLoading.value = false
  }
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该数据吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteData(row.id)
    ElMessage.success('删除成功')
    loadRows()
  } catch {}
}

onMounted(loadRows)

onMounted(() => {
  if (typeof ResizeObserver === 'undefined') return
  leftResizeObserver = new ResizeObserver(() => updateRightPanelHeight())
  if (collectLeftRef.value) {
    leftResizeObserver.observe(collectLeftRef.value)
  }
})

onBeforeUnmount(() => {
  if (leftResizeObserver) {
    leftResizeObserver.disconnect()
  }
})
</script>

<style scoped>
.data-view { display: flex; flex-direction: column; gap: 16px; }
.page-title { font-size: 18px; font-weight: 700; color: #333; }
.stats-cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.stat-card { background: #fff; border-radius: 8px; padding: 24px; text-align: center; }
.stat-value { font-size: 38px; line-height: 1; font-weight: 700; margin-bottom: 12px; }
.stat-label { font-size: 16px; color: #606266; }
.text-black { color: #303133; }
.text-green { color: #67c23a; }
.text-orange { color: #e6a23c; }
.text-red { color: #f56c6c; }
.content-card { border-radius: 8px; }
.search-form { background-color: #fcfcfc; padding: 15px; border-radius: 4px; margin-bottom: 20px; display: flex; flex-wrap: wrap; align-items: center; }
.search-form :deep(.el-form-item) { margin-bottom: 12px; margin-right: 24px; }
.data-table :deep(.el-table__header) th { background-color: #f5f7fa; color: #606266; font-weight: 700; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
.collect-layout { display: grid; grid-template-columns: 1fr; gap: 16px; align-items: stretch; }
.collect-layout.has-detail { grid-template-columns: 55% 45%; }
.collect-left { min-width: 0; }
.collect-right { min-width: 0; display: flex; align-items: stretch; height: 100%; overflow: hidden; }
.detail-card { border-radius: 8px; height: 100%; display: flex; flex-direction: column; }
.detail-card__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.detail-actions { display: flex; align-items: center; gap: 8px; }
.section-title { font-size: 14px; font-weight: 700; color: #303133; }
.detail-content { display: flex; flex-direction: column; gap: 12px; flex: 1; min-height: 0; }
.detail-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; }
.meta-item { display: grid; grid-template-columns: 84px 1fr; align-items: center; gap: 8px; padding: 6px 0; }
.meta-item .label { color: #909399; font-weight: 600; }
.detail-block { display: flex; flex-direction: column; gap: 8px; flex: 1; min-height: 0; }
.detail-block__title { font-size: 13px; font-weight: 600; color: #606266; }
.detail-block__body { flex: 1; min-height: 0; overflow: auto; }
.detail-table :deep(.el-table__header) th { background-color: #f5f7fa; color: #606266; font-weight: 700; }
.json-pre { margin: 0; white-space: pre-wrap; word-break: break-word; background: #f8fafc; border: 1px solid #ebeef5; border-radius: 6px; padding: 12px; color: #303133; height: 100%; overflow: auto; }

@media (max-width: 1100px) {
  .collect-layout { grid-template-columns: 1fr; }
}
</style>
