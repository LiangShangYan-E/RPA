<template>
  <div class="flow-list-view">
    <div class="page-title">流程列表</div>
    
    <el-card shadow="never" class="content-card">
      <div class="action-bar">
        <el-button type="primary" @click="onAdd">新增流程</el-button>
      </div>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="流程名称:">
          <el-input v-model="searchForm.processName" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="流程编码:">
          <el-input v-model="searchForm.processCode" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="状态:">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 150px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="flows" stripe class="flow-table">
        <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" />
        <el-table-column prop="processCode" label="流程编码" min-width="120" />
        <el-table-column prop="processName" label="流程名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="250" show-overflow-tooltip />
        <el-table-column prop="stepCount" label="步骤数" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small" effect="light">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link @click="onViewDetail(row)">查看</el-button>
              <el-button type="primary" link @click="onEdit(row)">编辑</el-button>
              <el-button type="primary" link @click="onDesign(row)">设计</el-button>
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
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑/查看弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增流程' : dialogType === 'edit' ? '编辑流程' : '查看流程'"
      width="600px"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="dialogType === 'view' ? {} : rules"
        label-width="100px"
        class="dialog-form"
      >
        <el-form-item label="流程编码" prop="processCode">
          <el-input v-model="form.processCode" placeholder="如 PROCESS_001" :disabled="dialogType !== 'add'" :readonly="dialogType === 'view'" />
        </el-form-item>
        <el-form-item label="流程名称" prop="processName">
          <el-input v-model="form.processName" placeholder="如 税务发票采集流程" :readonly="dialogType === 'view'" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" :readonly="dialogType === 'view'" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status" :disabled="dialogType === 'view'">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            v-if="dialogType !== 'view'"
            type="primary"
            :loading="submitting"
            @click="onSubmit"
          >确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProcessList, createProcess, updateProcess, deleteProcess } from '../api/process'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const flows = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  processName: '',
  processCode: '',
  status: ''
})

const dialogVisible = ref(false)
const dialogType = ref('add') // 'add' | 'edit' | 'view'
const formRef = ref(null)
const currentId = ref(null)

const form = reactive({
  processCode: '',
  processName: '',
  description: '',
  status: 1,
  stepCount: 0
})

const rules = {
  processCode: [{ required: true, message: '请输入流程编码', trigger: 'blur' }],
  processName: [{ required: true, message: '请输入流程名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const getRowId = (row) => row?.id ?? row?.processId ?? row?.processID ?? row?.process_id ?? null

const loadFlows = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      processName: searchForm.processName || undefined,
      processCode: searchForm.processCode || undefined,
      status: searchForm.status !== '' ? searchForm.status : undefined
    }
    const res = await getProcessList(params)
    if (res.data?.code === 200) {
      flows.value = res.data.data.list || []
      total.value = res.data.data.total || 0
    }
  } catch (error) {
    console.error('加载流程失败:', error)
    ElMessage.error('加载流程列表失败')
  } finally {
    loading.value = false
  }
}

const indexMethod = (index) => (currentPage.value - 1) * pageSize.value + index + 1

const onSearch = () => {
  currentPage.value = 1
  loadFlows()
}

const onReset = () => {
  searchForm.processName = ''
  searchForm.processCode = ''
  searchForm.status = ''
  currentPage.value = 1
  loadFlows()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  loadFlows()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadFlows()
}

const onAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
}

const onEdit = (row) => {
  dialogType.value = 'edit'
  currentId.value = getRowId(row)
  Object.assign(form, {
    processCode: row.processCode,
    processName: row.processName,
    description: row.description,
    status: row.status,
    stepCount: row.stepCount || 0
  })
  dialogVisible.value = true
}

const resetForm = () => {
  if (formRef.value) formRef.value.resetFields()
  Object.assign(form, {
    processCode: '',
    processName: '',
    description: '',
    status: 1,
    stepCount: 0
  })
  currentId.value = null
}

const onSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (dialogType.value === 'add') {
          await createProcess(form)
          ElMessage.success('新增流程成功')
        } else {
          await updateProcess(currentId.value, form)
          ElMessage.success('修改流程成功')
        }
        dialogVisible.value = false
        loadFlows()
      } catch (error) {
        console.error('保存流程失败:', error)
        ElMessage.error(dialogType.value === 'add' ? '新增流程失败' : '修改流程失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const onViewDetail = (row) => {
  dialogType.value = 'view'
  currentId.value = getRowId(row)
  Object.assign(form, {
    processCode: row.processCode,
    processName: row.processName,
    description: row.description,
    status: row.status,
    stepCount: row.stepCount || 0
  })
  dialogVisible.value = true
}

const onDesign = (row) => {
  const id = getRowId(row)
  if (!id) {
    ElMessage.error('缺少流程ID，无法进入设计')
    return
  }
  router.push(`/flow/design/${id}`)
}

const onDelete = (row) => {
  ElMessageBox.confirm(`确定要删除流程 ${row.processName} 吗？`, '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      const id = getRowId(row)
      if (!id) {
        ElMessage.error('缺少流程ID，无法删除')
        return
      }
      await deleteProcess(id)
      ElMessage.success('删除成功')
      loadFlows()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(loadFlows)
</script>

<style scoped>
.flow-list-view {
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

.search-form :deep(.el-input) {
  width: 220px;
}

.flow-table :deep(.el-table__header) th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 700;
}

.flow-table :deep(.el-table__inner-wrapper) {
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
