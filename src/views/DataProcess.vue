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
        <div class="stat-label">正常</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-orange">{{ correctedCount }}</div>
        <div class="stat-label">已修正</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-red">{{ errorCount }}</div>
        <div class="stat-label">异常</div>
      </div>
    </div>

    <el-card shadow="never" class="content-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="任务ID:">
          <el-input v-model="searchForm.taskId" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="执行ID:">
          <el-input v-model="searchForm.executionId" placeholder="请输入执行ID" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="关键字:">
          <el-input v-model="searchForm.keyword" placeholder="数据编号/执行ID/任务编码/标题/内容" clearable style="width: 260px" />
        </el-form-item>
        <el-form-item label="状态:">
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
          <el-button type="success" @click="openCreate">数据补录</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="rows" v-loading="loading" stripe class="data-table">
        <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" />
        <el-table-column prop="id" label="数据ID" width="110" />
        <el-table-column prop="dataNo" label="数据编号" min-width="170" show-overflow-tooltip />
        <el-table-column prop="taskId" label="任务ID" width="120" />
        <el-table-column prop="taskCode" label="任务编码" min-width="170" show-overflow-tooltip />
        <el-table-column prop="executionId" label="执行ID" min-width="180" />
        <el-table-column prop="dataStatus" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.dataStatus]" size="small" effect="light">{{ statusLabelMap[row.dataStatus] || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataTitle" label="数据标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDetail(row.id)">查看</el-button>
            <el-button type="warning" link @click="openEdit(row)">数据修正</el-button>
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

    <el-dialog v-model="createVisible" title="数据补录" width="760px" :close-on-click-modal="false">
      <el-form :model="createForm" label-width="110px">
        <el-form-item label="执行ID" required>
          <el-input v-model="createForm.executionId" placeholder="如 EXEC_TEST_001" />
        </el-form-item>
        <el-form-item label="任务ID">
          <el-input v-model="createForm.taskId" placeholder="请输入任务ID" />
        </el-form-item>
        <el-form-item label="数据阶段" required>
          <el-select v-model="createForm.dataStage" style="width: 100%" placeholder="请选择">
            <el-option label="COLLECT" value="COLLECT" />
            <el-option label="RESULT" value="RESULT" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据状态" required>
          <el-select v-model="createForm.dataStatus" style="width: 100%" placeholder="请选择">
            <el-option label="NORMAL" value="NORMAL" />
            <el-option label="CORRECTED" value="CORRECTED" />
            <el-option label="ERROR" value="ERROR" />
          </el-select>
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

    <el-dialog
      v-model="detailVisible"
      title="加工数据详情"
      width="920px"
      :close-on-click-modal="false"
      @close="closeDetail"
    >
      <div class="detail-grid">
        <div class="detail-item"><span class="label">数据ID</span><span>{{ displayValue(currentDetail.id) }}</span></div>
        <div class="detail-item"><span class="label">数据编号</span><span>{{ displayValue(currentDetail.dataNo) }}</span></div>
        <div class="detail-item"><span class="label">任务ID</span><span>{{ displayValue(currentDetail.taskId) }}</span></div>
        <div class="detail-item"><span class="label">任务编码</span><span>{{ displayValue(currentDetail.taskCode) }}</span></div>
        <div class="detail-item"><span class="label">执行ID</span><span>{{ displayValue(currentDetail.executionId) }}</span></div>
        <div class="detail-item"><span class="label">数据阶段</span><span>{{ displayValue(currentDetail.dataStage) }}</span></div>
        <div class="detail-item">
          <span class="label">状态</span>
          <span>
            <el-tag :type="statusTypeMap[currentDetail.dataStatus]" size="small" effect="light">
              {{ statusLabelMap[currentDetail.dataStatus] || '-' }}
            </el-tag>
          </span>
        </div>
        <div class="detail-item"><span class="label">数据标题</span><span>{{ displayValue(currentDetail.dataTitle) }}</span></div>
        <div class="detail-item"><span class="label">创建时间</span><span>{{ displayValue(currentDetail.createdAt) }}</span></div>
        <div class="detail-item"><span class="label">更新时间</span><span>{{ displayValue(currentDetail.updatedAt) }}</span></div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">原始内容</div>
        <pre class="detail-pre">{{ displayValue(currentDetail.rawContent) }}</pre>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">修正内容</div>
        <pre class="detail-pre">{{ displayValue(currentDetail.correctedContent) }}</pre>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">备注</div>
        <pre class="detail-pre">{{ displayValue(currentDetail.remark) }}</pre>
      </div>

      <template #footer>
        <el-button @click="closeDetail">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="editVisible"
      title="数据修正"
      width="760px"
      :close-on-click-modal="false"
      @close="closeEdit"
    >
      <el-form :model="editForm" label-width="110px">
        <el-form-item label="数据ID">
          <el-input :model-value="displayValue(editForm.id)" disabled />
        </el-form-item>
        <el-form-item label="执行ID">
          <el-input :model-value="displayValue(editForm.executionId)" disabled />
        </el-form-item>
        <el-form-item label="数据标题">
          <el-input v-model="editForm.dataTitle" placeholder="请输入数据标题" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.dataStatus" placeholder="请选择" style="width: 100%">
            <el-option label="NORMAL" value="NORMAL" />
            <el-option label="CORRECTED" value="CORRECTED" />
            <el-option label="ERROR" value="ERROR" />
          </el-select>
        </el-form-item>
        <el-form-item label="原始内容">
          <el-input :model-value="displayValue(editForm.rawContent)" type="textarea" :rows="4" disabled />
        </el-form-item>
        <el-form-item label="修正内容" required>
          <el-input v-model="editForm.correctedContent" type="textarea" :rows="5" placeholder="请输入修正后的内容" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeEdit">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="onSubmitEdit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createData, deleteData, getDataDetail, getDataPage, updateData } from '../api/data'
import { formatLocalDateTime } from '../utils/datetime'

const route = useRoute()

const searchForm = reactive({
  keyword: '',
  taskId: '',
  executionId: '',
  dataStatus: '',
  timeRange: []
})

const appliedSearch = reactive({
  keyword: '',
  taskId: '',
  executionId: '',
  dataStatus: '',
  timeRange: []
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const rows = ref([])
const detailVisible = ref(false)
const currentDetail = ref({})

const createVisible = ref(false)
const createLoading = ref(false)
const createForm = reactive({
  executionId: '',
  taskId: '',
  dataStage: 'COLLECT',
  dataStatus: 'NORMAL',
  dataTitle: '',
  rawContent: '',
  remark: ''
})

const editVisible = ref(false)
const editLoading = ref(false)
const editForm = reactive({
  id: '',
  executionId: '',
  dataTitle: '',
  dataStatus: 'CORRECTED',
  rawContent: '',
  correctedContent: '',
  remark: ''
})

const statusTypeMap = { NORMAL: 'success', CORRECTED: 'warning', ERROR: 'danger', DELETED: 'info' }
const statusLabelMap = { NORMAL: '正常', CORRECTED: '已修正', ERROR: '异常', DELETED: '已删除' }

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
  const createdAtRaw = item.createdAt ?? item.created_at ?? item.createTime ?? ''
  const updatedAtRaw = item.updatedAt ?? item.updated_at ?? item.updateTime ?? ''
  return {
    id: item.id ?? '',
    dataNo: item.dataNo ?? item.data_no ?? '',
    taskId: item.taskId ?? item.task_id ?? '',
    taskCode: item.taskCode ?? item.task_code ?? '',
    executionId: item.executionId ?? item.execution_no ?? item.executionNo ?? '',
    dataStage: item.dataStage ?? item.data_stage ?? '',
    dataStatus: normalizeStatus(item.dataStatus ?? item.data_status),
    dataTitle: item.dataTitle ?? '',
    createdAt: createdAtRaw ? formatLocalDateTime(createdAtRaw) : '',
    updatedAt: updatedAtRaw ? formatLocalDateTime(updatedAtRaw) : '',
    rawContent: item.rawContent ?? '',
    correctedContent: item.correctedContent ?? '',
    remark: item.remark ?? ''
  }
}

const totalCount = computed(() => total.value)
const successCount = computed(() => rows.value.filter((r) => r.dataStatus === 'NORMAL').length)
const correctedCount = computed(() => rows.value.filter((r) => r.dataStatus === 'CORRECTED').length)
const errorCount = computed(() => rows.value.filter((r) => r.dataStatus === 'ERROR').length)

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
    const res = await getDataPage(buildParams())
    rows.value = Array.isArray(res.list) ? res.list.map((item) => normalizeDataItem(item)) : []
    total.value = res.total
  } catch (error) {
    rows.value = []
    total.value = 0
    ElMessage.error(error?.response?.data?.message || error?.message || '加载加工数据失败')
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
  searchForm.dataStatus = ''
  searchForm.timeRange = []

  appliedSearch.keyword = ''
  appliedSearch.taskId = ''
  appliedSearch.executionId = ''
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

const displayValue = (value) => {
  if (value === 0) return '0'
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

const openCreate = () => {
  createForm.executionId = ''
  createForm.taskId = ''
  createForm.dataStage = 'COLLECT'
  createForm.dataStatus = 'NORMAL'
  createForm.dataTitle = ''
  createForm.rawContent = ''
  createForm.remark = ''
  createVisible.value = true
}

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
      dataStage: createForm.dataStage,
      dataStatus: createForm.dataStatus,
      dataTitle: createForm.dataTitle,
      rawContent: createForm.rawContent,
      remark: createForm.remark || undefined
    })
    ElMessage.success('补录成功')
    createVisible.value = false
    loadRows()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error?.message || '补录失败')
  } finally {
    createLoading.value = false
  }
}

const openDetail = async (id) => {
  if (!id) return
  try {
    const detail = await getDataDetail(id)
    currentDetail.value = normalizeDataItem(detail)
    detailVisible.value = true
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error?.message || '加载详情失败')
  }
}

const closeDetail = () => {
  detailVisible.value = false
  currentDetail.value = {}
}

const openEdit = async (row) => {
  if (!row?.id) return
  try {
    const detail = await getDataDetail(row.id)
    const normalized = normalizeDataItem(detail)
    editForm.id = normalized.id
    editForm.executionId = normalized.executionId
    editForm.dataTitle = normalized.dataTitle
    editForm.dataStatus = normalized.dataStatus || 'CORRECTED'
    editForm.rawContent = normalized.rawContent
    editForm.correctedContent = normalized.correctedContent
    editForm.remark = normalized.remark
    editVisible.value = true
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error?.message || '加载修正数据失败')
  }
}

const closeEdit = () => {
  editVisible.value = false
  editForm.id = ''
  editForm.executionId = ''
  editForm.dataTitle = ''
  editForm.dataStatus = 'CORRECTED'
  editForm.rawContent = ''
  editForm.correctedContent = ''
  editForm.remark = ''
}

const onSubmitEdit = async () => {
  if (!editForm.id) return
  if (!editForm.correctedContent) {
    ElMessage.warning('请填写修正内容')
    return
  }
  editLoading.value = true
  try {
    await updateData(editForm.id, {
      dataTitle: editForm.dataTitle || undefined,
      correctedContent: editForm.correctedContent,
      dataStatus: editForm.dataStatus || 'CORRECTED',
      remark: editForm.remark || undefined
    })
    ElMessage.success('修正成功')
    closeEdit()
    loadRows()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error?.message || '修正失败')
  } finally {
    editLoading.value = false
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
  if (taskId) {
    searchForm.taskId = taskId
    appliedSearch.taskId = taskId
    currentPage.value = 1
  }
  if (executionId) {
    searchForm.executionId = executionId
    appliedSearch.executionId = executionId
    currentPage.value = 1
  }
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
.data-view { display: flex; flex-direction: column; gap: 16px; }
.page-title { font-size: 18px; font-weight: 700; color: #333; }
.stats-cards { display: flex; gap: 16px; }
.stat-card { flex: 1; background-color: #fff; border-radius: 8px; padding: 24px; text-align: center; border: 1px solid #ebeef5; }
.stat-value { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
.stat-label { font-size: 14px; color: #606266; }
.text-black { color: #333; }
.text-green { color: #67c23a; }
.text-orange { color: #e6a23c; }
.text-red { color: #f56c6c; }
.content-card { border-radius: 8px; }
.search-form { background-color: #fcfcfc; padding: 15px; border-radius: 4px; margin-bottom: 20px; display: flex; flex-wrap: wrap; align-items: center; }
.search-form :deep(.el-form-item) { margin-bottom: 0; margin-right: 24px; }
.data-table :deep(.el-table__header) th { background-color: #f5f7fa; color: #606266; font-weight: 700; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #ebeef5; border-bottom: none; }
.detail-item { display: grid; grid-template-columns: 120px 1fr; min-height: 44px; border-bottom: 1px solid #ebeef5; }
.detail-item .label { padding: 10px 12px; background: #f5f7fa; color: #606266; font-weight: 600; border-right: 1px solid #ebeef5; }
.detail-item > span:last-child { padding: 10px 12px; color: #303133; overflow-wrap: anywhere; }
.detail-section { margin-top: 16px; }
.detail-section__title { text-align: center; font-weight: 700; color: #303133; margin-bottom: 10px; }
.detail-pre { margin: 0; padding: 12px; min-height: 56px; background: #f5f7fa; border-radius: 4px; white-space: pre-wrap; word-break: break-word; color: #606266; font-size: 13px; }
</style>