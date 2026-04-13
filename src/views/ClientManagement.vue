<template>
  <div class="robot-list-view">
    <div class="page-title">机器人列表</div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-value text-black">{{ total }}</div>
        <div class="stat-label">总机器人数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-green">{{ statusCount.online }}</div>
        <div class="stat-label">在线</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-orange">{{ statusCount.working }}</div>
        <div class="stat-label">工作中</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-red">{{ statusCount.offline }}</div>
        <div class="stat-label">离线</div>
      </div>
    </div>

    <el-card shadow="never" class="content-card">
      <div class="action-bar">
        <el-button type="primary" @click="openCreateDialog">新增机器人</el-button>
      </div>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="机器人名称:">
          <el-input v-model="searchForm.robotName" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="机器人编码:">
          <el-input v-model="searchForm.robotCode" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="状态:">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 150px">
            <el-option label="在线" value="online" />
            <el-option label="工作中" value="working" />
            <el-option label="离线" value="offline" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="clients" stripe class="client-table" v-loading="loading">
        <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" />
        <el-table-column prop="robotCode" label="机器人编码" min-width="150" />
        <el-table-column prop="robotName" label="机器人名称" min-width="150" />
        <el-table-column prop="robotType" label="类型" min-width="120" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small" effect="light">
              {{ statusLabelMap[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="onEdit(row)">编辑</el-button>
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

    <!-- Create Dialog -->
    <el-dialog v-model="createDialogVisible" title="新增机器人" width="520px" :close-on-click-modal="false">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="机器人编码" prop="robotCode">
          <el-input v-model="createForm.robotCode" placeholder="字母/数字开头，支持_-" maxlength="64" />
        </el-form-item>
        <el-form-item label="机器人名称" prop="robotName">
          <el-input v-model="createForm.robotName" placeholder="请输入机器人名称" maxlength="100" />
        </el-form-item>
        <el-form-item label="机器人类型" prop="robotType">
          <el-input v-model="createForm.robotType" placeholder="字母开头，如 WebScraper" maxlength="50" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="请输入描述" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="createForm.status" style="width: 100%">
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">确定</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog v-model="editDialogVisible" title="编辑机器人" width="520px" :close-on-click-modal="false">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="机器人编码">
          <el-input :model-value="editForm.robotCode" disabled />
        </el-form-item>
        <el-form-item label="机器人名称" prop="robotName">
          <el-input v-model="editForm.robotName" placeholder="请输入机器人名称" maxlength="100" />
        </el-form-item>
        <el-form-item label="机器人类型" prop="robotType">
          <el-input v-model="editForm.robotType" placeholder="字母开头，如 WebScraper" maxlength="50" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="请输入描述" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="editForm.status" style="width: 100%">
            <el-option label="在线" value="online" />
            <el-option label="工作中" value="working" />
            <el-option label="离线" value="offline" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEdit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRobotList, createRobot, updateRobot, deleteRobot } from '../api/robot'

const loading = ref(false)
const submitting = ref(false)
const clients = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const statusCount = reactive({ online: 0, working: 0, offline: 0 })

const searchForm = reactive({
  robotName: '',
  robotCode: '',
  status: ''
})

const statusTypeMap = { online: 'success', offline: 'info', working: 'warning' }
const statusLabelMap = { online: '在线', offline: '离线', working: '工作中' }

const indexMethod = (index) => (currentPage.value - 1) * pageSize.value + index + 1

// --- Load Data ---
const loadClients = async () => {
  loading.value = true
  try {
    const res = await getRobotList({
      page: currentPage.value,
      size: pageSize.value,
      robotName: searchForm.robotName,
      robotCode: searchForm.robotCode,
      status: searchForm.status
    })
    const payload = res.data || res
    const list = payload.records || payload.list || []
    clients.value = list
    total.value = payload.total || 0
    statusCount.online = clients.value.filter((c) => c.status === 'online').length
    statusCount.working = clients.value.filter((c) => c.status === 'working').length
    statusCount.offline = clients.value.filter((c) => c.status === 'offline').length
  } catch (e) {
    console.error('获取机器人列表失败:', e)
    ElMessage.error('获取机器人列表失败')
  } finally {
    loading.value = false
  }
}

// --- Search ---
const onSearch = () => {
  currentPage.value = 1
  loadClients()
}

const onReset = () => {
  searchForm.robotName = ''
  searchForm.robotCode = ''
  searchForm.status = ''
  currentPage.value = 1
  loadClients()
}

// --- Pagination ---
const handleSizeChange = () => {
  currentPage.value = 1
  loadClients()
}

const handleCurrentChange = () => {
  loadClients()
}

// --- Create ---
const createDialogVisible = ref(false)
const createFormRef = ref(null)
const createForm = reactive({
  robotCode: '',
  robotName: '',
  robotType: '',
  description: '',
  status: 'offline'
})

const createRules = {
  robotCode: [
    { required: true, message: '请输入机器人编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/, message: '字母/数字开头，支持_-，最长64位', trigger: 'blur' }
  ],
  robotName: [
    { required: true, message: '请输入机器人名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  robotType: [
    { required: true, message: '请输入机器人类型', trigger: 'blur' },
    { pattern: /^[a-zA-Z]/, message: '必须以字母开头', trigger: 'blur' }
  ]
}

const openCreateDialog = () => {
  createForm.robotCode = ''
  createForm.robotName = ''
  createForm.robotType = ''
  createForm.description = ''
  createForm.status = 'offline'
  createDialogVisible.value = true
  setTimeout(() => createFormRef.value?.clearValidate(), 0)
}

const submitCreate = async () => {
  try {
    await createFormRef.value?.validate()
  } catch { return }
  submitting.value = true
  try {
    await createRobot({
      robotCode: createForm.robotCode,
      robotName: createForm.robotName,
      robotType: createForm.robotType,
      description: createForm.description,
      status: createForm.status
    })
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    loadClients()
  } catch {
    ElMessage.error('创建失败')
  } finally {
    submitting.value = false
  }
}

// --- Edit ---
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  id: null,
  robotCode: '',
  robotName: '',
  robotType: '',
  description: '',
  status: 'offline'
})

const editRules = {
  robotName: [
    { required: true, message: '请输入机器人名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  robotType: [
    { required: true, message: '请输入机器人类型', trigger: 'blur' },
    { pattern: /^[a-zA-Z]/, message: '必须以字母开头', trigger: 'blur' }
  ]
}

const onEdit = (row) => {
  editForm.id = row.id
  editForm.robotCode = row.robotCode || ''
  editForm.robotName = row.robotName || ''
  editForm.robotType = row.robotType || ''
  editForm.description = row.description || ''
  editForm.status = row.status || 'offline'
  editDialogVisible.value = true
  setTimeout(() => editFormRef.value?.clearValidate(), 0)
}

const submitEdit = async () => {
  try {
    await editFormRef.value?.validate()
  } catch { return }
  submitting.value = true
  try {
    await updateRobot(editForm.id, {
      robotName: editForm.robotName,
      robotType: editForm.robotType,
      description: editForm.description,
      status: editForm.status
    })
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    loadClients()
  } catch {
    ElMessage.error('更新失败')
  } finally {
    submitting.value = false
  }
}

// --- Delete ---
const onDelete = async (row) => {
  if (row.status === 'working') {
    ElMessageBox.alert('该机器人正在工作中，无法删除。请先停止任务或等待任务完成后再操作。', '无法删除', { type: 'warning' })
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除机器人「${row.robotName}」吗？`, '提示', { type: 'warning' })
    await deleteRobot(row.id)
    ElMessage.success('删除成功')
    loadClients()
  } catch (e) {
    const msg = e?.response?.data?.message
    if (msg) ElMessage.error(msg)
  }
}

onMounted(loadClients)
</script>

<style scoped>
.robot-list-view {
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

.client-table :deep(.el-table__header) th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 700;
}

.client-table :deep(.el-table__inner-wrapper) {
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
