<template>
  <div class="user-management-view">
    <div class="page-title">用户管理</div>
    <el-card shadow="never" class="content-card">
      <div class="action-row">
        <el-button type="primary" @click="openAddDialog">新增用户</el-button>
      </div>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名:">
          <el-input v-model="searchForm.username" placeholder="请输入" style="width: 220px" />
        </el-form-item>
        <el-form-item label="姓名:">
          <el-input v-model="searchForm.name" placeholder="请输入" style="width: 220px" />
        </el-form-item>
        <el-form-item label="角色:">
          <el-select v-model="searchForm.roleId" placeholder="请选择" style="width: 220px" clearable>
            <el-option v-for="r in roleOptions" :key="r.id" :label="r.roleName" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="pagedUsers" border stripe class="user-table">
        <el-table-column
          type="index"
          label="序号"
          width="70"
          align="center"
          :index="indexMethod"
        />
        <el-table-column prop="username" label="用户名" min-width="140" />
        <el-table-column prop="realName" label="姓名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="phone" label="手机号" min-width="140" />
        <el-table-column prop="roleName" label="角色" width="110" align="center">
          <template #default="{ row }">
            <el-tag type="danger" effect="light" size="small">{{ row.roleName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" effect="light" size="small">
              {{ statusLabelMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
            <el-button type="warning" link @click="onResetPassword(row)">重置密码</el-button>
            <el-button
              :type="row.status === 0 ? 'success' : 'danger'"
              link
              @click="onToggleUserStatus(row)"
            >
              {{ row.status === 0 ? '启用' : '禁用' }}
            </el-button>
            <el-button type="danger" link @click="onDeleteUser(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalUsers"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="addDialogVisible" title="新增用户" width="640px" :close-on-click-modal="false">
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="80px" class="add-user-form">
        <el-form-item label="用户名" prop="username" required>
          <el-input v-model="addForm.username" :maxlength="USERNAME_MAX" show-word-limit />
        </el-form-item>
        <el-form-item label="姓名" prop="realName" required>
          <el-input v-model="addForm.realName" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="addForm.email" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone" required>
          <el-input v-model="addForm.phone" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId" required>
          <el-select v-model="addForm.roleId" placeholder="请选择" style="width: 100%">
            <el-option v-for="r in roleOptions" :key="r.id" :label="r.roleName" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" prop="password" required>
          <el-input v-model="addForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="状态" prop="status" required>
          <el-radio-group v-model="addForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAddUser">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑用户" width="640px" :close-on-click-modal="false">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="80px" class="edit-user-form">
        <el-form-item label="用户名" prop="username" required>
          <el-input v-model="editForm.username" disabled class="username-disabled" :maxlength="USERNAME_MAX" show-word-limit />
        </el-form-item>
        <el-form-item label="姓名" prop="realName" required>
          <el-input v-model="editForm.realName" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone" required>
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId" required>
          <el-select v-model="editForm.roleId" placeholder="请选择" style="width: 100%">
            <el-option v-for="r in roleOptions" :key="r.id" :label="r.roleName" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status" required>
          <el-radio-group v-model="editForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditUser">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword, toggleUserStatus, getRoles } from '../api/system'

const USERNAME_MAX = 20

const searchForm = reactive({
  username: '',
  name: '',
  roleId: ''
})

const appliedSearch = reactive({
  username: '',
  name: '',
  roleId: ''
})

const allUsers = ref([])
const totalUsers = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const statusTypeMap = {
  1: 'success',
  0: 'info'
}

const statusLabelMap = {
  1: '启用',
  0: '禁用'
}

const roleOptions = ref([])

const loadRoles = async () => {
  try {
    const res = await getRoles()
    roleOptions.value = res.data || []
  } catch (error) {
    console.error('Failed to load roles:', error)
  }
}

const loadUsers = async () => {
  try {
    const res = await getUsers({
      page: currentPage.value,
      size: pageSize.value,
      username: appliedSearch.username || undefined,
      realName: appliedSearch.name || undefined,
      roleId: appliedSearch.roleId || undefined
    })
    allUsers.value = res.data?.list || []
    totalUsers.value = res.data?.total || 0
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

// remove frontend filtering since we now use backend
const pagedUsers = computed(() => allUsers.value)

const indexMethod = (index) => (currentPage.value - 1) * pageSize.value + index + 1

const addDialogVisible = ref(false)
const addFormRef = ref(null)
const addForm = reactive({
  username: '',
  realName: '',
  email: '',
  phone: '',
  roleId: '',
  password: '',
  status: 1
})

const addRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度不能少于3位', trigger: 'blur' },
    { max: USERNAME_MAX, message: '用户名过长', trigger: 'blur' }
  ],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: ['blur', 'change'] }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
})

const resetAddForm = () => {
  addForm.username = ''
  addForm.realName = ''
  addForm.email = ''
  addForm.phone = ''
  addForm.roleId = ''
  addForm.password = ''
  addForm.status = 1
  addFormRef.value?.clearValidate?.()
}

const openAddDialog = () => {
  resetAddForm()
  addDialogVisible.value = true
}

const submitAddUser = async () => {
  if (!addFormRef.value) return
  await addFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      await createUser(addForm)
      addDialogVisible.value = false
      ElMessage.success('新增用户成功')
      currentPage.value = 1
      loadUsers()
    } catch (e) {
      const status = e?.response?.status
      const serverMsg = e?.response?.data?.message || e?.response?.data?.msg
      if (addForm.username && String(addForm.username).length > USERNAME_MAX) {
        ElMessage.error('用户名过长')
      } else if (status === 409) {
        ElMessage.error(serverMsg || '用户名已存在')
      } else {
        ElMessage.error(serverMsg || e?.message || '新增用户失败')
      }
    }
  })
}

const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editTarget = ref(null)
const editForm = reactive({
  username: '',
  realName: '',
  email: '',
  phone: '',
  roleId: '',
  status: 1
})

const editRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度不能少于3位', trigger: 'blur' },
    { max: USERNAME_MAX, message: '用户名过长', trigger: 'blur' }
  ],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: ['blur', 'change'] }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
})

const openEditDialog = (row) => {
  editTarget.value = row
  editForm.username = row?.username || ''
  editForm.realName = row?.realName || ''
  editForm.email = row?.email || ''
  editForm.phone = row?.phone || ''
  editForm.roleId = row?.roleId || ''
  editForm.status = row?.status ?? 1
  editFormRef.value?.clearValidate?.()
  editDialogVisible.value = true
}

const submitEditUser = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    if (editTarget.value) {
      try {
        await updateUser(editTarget.value.id, {
          realName: editForm.realName,
          email: editForm.email,
          phone: editForm.phone,
          roleId: editForm.roleId,
          status: editForm.status
        })
        editDialogVisible.value = false
        ElMessage.success('编辑用户成功')
        loadUsers()
      } catch (e) {
        console.error(e)
      }
    }
  })
}

const onResetPassword = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要重置该用户的密码为 123456 吗?`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await resetUserPassword(row.id)
    ElMessage.success('密码已重置为 123456')
  } catch {}
}

const onToggleUserStatus = async (row) => {
  if (!row) return
  const nextStatus = row.status === 0 ? 1 : 0
  const actionText = nextStatus === 0 ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${actionText}该用户吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await toggleUserStatus(row.id, nextStatus)
    row.status = nextStatus
    ElMessage.success(`用户已${actionText}`)
  } catch {}
}

const onDeleteUser = async (row) => {
  if (!row) return
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    loadUsers()
  } catch {}
}

const onSearch = () => {
  if (searchForm.username && String(searchForm.username).length > USERNAME_MAX) {
    ElMessage.error('用户名过长')
    return
  }
  appliedSearch.username = searchForm.username
  appliedSearch.name = searchForm.name
  appliedSearch.roleId = searchForm.roleId
  currentPage.value = 1
  loadUsers()
}

const onReset = () => {
  searchForm.username = ''
  searchForm.name = ''
  searchForm.roleId = ''

  appliedSearch.username = ''
  appliedSearch.name = ''
  appliedSearch.roleId = ''

  currentPage.value = 1
  loadUsers()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  loadUsers()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadUsers()
}

onMounted(async () => {
  await loadRoles()
  await loadUsers()
})
</script>

<style scoped>
.user-management-view {
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

.action-row {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
}

.search-form {
  background-color: #fcfcfc;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.user-table :deep(.el-table__header) th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 700;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.add-user-form :deep(.el-input),
.add-user-form :deep(.el-select) {
  width: 100%;
}

.edit-user-form :deep(.el-input),
.edit-user-form :deep(.el-select) {
  width: 100%;
}

.username-disabled :deep(.el-input__inner) {
  cursor: default;
  user-select: none;
  pointer-events: none;
}
</style>
