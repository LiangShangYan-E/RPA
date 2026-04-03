<template>
  <div class="role-management-view">
    <div class="page-title">角色管理</div>
    <el-card shadow="never" class="content-card">
      <div class="action-row">
        <el-button type="primary" @click="openAddDialog">新增角色</el-button>
      </div>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="角色名称:">
          <el-input v-model="searchForm.name" placeholder="请输入" style="width: 220px" />
        </el-form-item>
        <el-form-item label="角色编码:">
          <el-input v-model="searchForm.code" placeholder="请输入" style="width: 220px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="pagedRoles" border stripe class="role-table">
        <el-table-column
          type="index"
          label="序号"
          width="70"
          align="center"
          :index="indexMethod"
        />
        <el-table-column prop="roleCode" label="角色编码" min-width="140" />
        <el-table-column prop="roleName" label="角色名称" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="180" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
            <el-button type="primary" link @click="openPermissionDialog(row)">分配权限</el-button>
            <el-button type="danger" link @click="onDeleteRole(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredRoles.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    <el-dialog v-model="addDialogVisible" title="新增角色" width="640px" :close-on-click-modal="false">
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="90px" class="add-role-form">
        <el-form-item label="角色编码" prop="roleCode" required>
          <el-input v-model="addForm.roleCode" :maxlength="ROLE_CODE_MAX" show-word-limit />
        </el-form-item>
        <el-form-item label="角色名称" prop="roleName" required>
          <el-input v-model="addForm.roleName" :maxlength="ROLE_NAME_MAX" show-word-limit />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="addForm.description" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAddRole">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑角色" width="640px" :close-on-click-modal="false">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="90px" class="edit-role-form">
        <el-form-item label="角色编码" prop="roleCode" required>
          <el-input v-model="editForm.roleCode" disabled class="code-disabled" :maxlength="ROLE_CODE_MAX" show-word-limit />
        </el-form-item>
        <el-form-item label="角色名称" prop="roleName" required>
          <el-input v-model="editForm.roleName" :maxlength="ROLE_NAME_MAX" show-word-limit />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditRole">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permissionDialogVisible" title="分配权限" width="820px" :close-on-click-modal="false">
      <div class="permission-dialog-body">
        <el-tree
          ref="permissionTreeRef"
          class="permission-tree"
          :data="permissionTreeData"
          node-key="id"
          show-checkbox
          default-expand-all
          highlight-current
          check-on-click-node
          :default-checked-keys="permissionCheckedKeys"
          :current-node-key="currentPermissionNodeKey"
          @check="onPermissionCheck"
          @node-click="onPermissionNodeClick"
        />
      </div>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPermission">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRoles, createRole, updateRole, deleteRole, getResourceTree, getRoleResourceIds, assignRoleResources } from '../api/system'

const ROLE_CODE_MAX = 64
const ROLE_NAME_MAX = 100

const searchForm = reactive({
  name: '',
  code: ''
})

const appliedSearch = reactive({
  name: '',
  code: ''
})

const allRoles = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const statusTypeMap = {
  enabled: 'success',
  disabled: 'info'
}

const statusLabelMap = {
  enabled: '启用',
  disabled: '禁用'
}

const filteredRoles = computed(() => {
  const name = (appliedSearch.name || '').trim()
  const code = (appliedSearch.code || '').trim()
  return allRoles.value.filter((r) => {
    const rName = r.roleName || ''
    const rCode = r.roleCode || ''
    const okName = !name || rName.includes(name)
    const okCode = !code || rCode.includes(code)
    return okName && okCode
  })
})

const pagedRoles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRoles.value.slice(start, end)
})

const indexMethod = (index) => (currentPage.value - 1) * pageSize.value + index + 1

const loadRoles = async () => {
  try {
    const res = await getRoles()
    allRoles.value = res.data || []
  } catch (error) {
    console.error('Failed to load roles:', error)
  }
}

const onSearch = () => {
  appliedSearch.name = searchForm.name
  appliedSearch.code = searchForm.code
  currentPage.value = 1
}

const onReset = () => {
  searchForm.name = ''
  searchForm.code = ''
  appliedSearch.name = ''
  appliedSearch.code = ''
  currentPage.value = 1
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

onMounted(loadRoles)

const addDialogVisible = ref(false)
const addFormRef = ref(null)
const addForm = reactive({
  roleCode: '',
  roleName: '',
  description: ''
})

const addRules = reactive({
  roleCode: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { max: ROLE_CODE_MAX, message: '角色编码过长', trigger: 'blur' }
  ],
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { max: ROLE_NAME_MAX, message: '角色名称过长', trigger: 'blur' }
  ]
})

const resetAddForm = () => {
  addForm.roleCode = ''
  addForm.roleName = ''
  addForm.description = ''
  addFormRef.value?.clearValidate?.()
}

const openAddDialog = () => {
  resetAddForm()
  addDialogVisible.value = true
}

const submitAddRole = async () => {
  if (!addFormRef.value) return
  await addFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      await createRole({
        roleCode: addForm.roleCode,
        roleName: addForm.roleName,
        description: addForm.description
      })
      addDialogVisible.value = false
      ElMessage.success('新增角色成功')
      currentPage.value = 1
      loadRoles()
    } catch (e) {
      const serverMsg = e?.response?.data?.message || e?.response?.data?.msg
      if (addForm.roleCode && String(addForm.roleCode).length > ROLE_CODE_MAX) {
        ElMessage.error('角色编码过长')
      } else if (addForm.roleName && String(addForm.roleName).length > ROLE_NAME_MAX) {
        ElMessage.error('角色名称过长')
      } else {
        ElMessage.error(serverMsg || e?.message || '新增角色失败')
      }
    }
  })
}

const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editTarget = ref(null)
const editForm = reactive({
  roleCode: '',
  roleName: '',
  description: ''
})

const editRules = reactive({
  roleCode: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { max: ROLE_CODE_MAX, message: '角色编码过长', trigger: 'blur' }
  ],
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { max: ROLE_NAME_MAX, message: '角色名称过长', trigger: 'blur' }
  ]
})

const openEditDialog = (row) => {
  editTarget.value = row
  editForm.roleCode = row?.roleCode || ''
  editForm.roleName = row?.roleName || ''
  editForm.description = row?.description || ''
  editFormRef.value?.clearValidate?.()
  editDialogVisible.value = true
}

const submitEditRole = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    if (editTarget.value) {
      try {
        await updateRole(editTarget.value.id, {
          roleName: editForm.roleName,
          description: editForm.description
        })
        editDialogVisible.value = false
        ElMessage.success('编辑角色成功')
        loadRoles()
      } catch (e) {
        const serverMsg = e?.response?.data?.message || e?.response?.data?.msg
        if (editForm.roleCode && String(editForm.roleCode).length > ROLE_CODE_MAX) {
          ElMessage.error('角色编码过长')
        } else if (editForm.roleName && String(editForm.roleName).length > ROLE_NAME_MAX) {
          ElMessage.error('角色名称过长')
        } else {
          ElMessage.error(serverMsg || e?.message || '编辑角色失败')
        }
      }
    }
  })
}

const permissionDialogVisible = ref(false)
const permissionTreeRef = ref(null)
const currentPermissionRole = ref(null)
const permissionCheckedKeys = ref([])
const currentPermissionNodeKey = ref('')

const permissionTreeData = ref([])

const loadPermissionTree = async () => {
  try {
    const res = await getResourceTree()
    // Convert backend schema to element-plus tree format if necessary
    // Assuming backend returns a structure that matches el-tree with id, resourceName, children
    // If different, map it accordingly
    const mapTree = (nodes) => {
      return nodes.map(node => ({
        id: node.id,
        label: node.resourceName,
        children: node.children ? mapTree(node.children) : []
      }))
    }
    permissionTreeData.value = res.data ? mapTree(res.data) : []
  } catch (error) {
    console.error('Failed to load resource tree:', error)
  }
}

const openPermissionDialog = async (row) => {
  currentPermissionRole.value = row
  try {
    const res = await getRoleResourceIds(row.id)
    permissionCheckedKeys.value = res.data || []
  } catch (e) {
    permissionCheckedKeys.value = []
  }
  
  if (!permissionTreeData.value.length) {
    await loadPermissionTree()
  }

  currentPermissionNodeKey.value = ''
  permissionDialogVisible.value = true
  await nextTick()
  permissionTreeRef.value?.setCheckedKeys(permissionCheckedKeys.value)
}

const onPermissionNodeClick = (data) => {
  currentPermissionNodeKey.value = data?.id || ''
}

const onPermissionCheck = (data) => {
  currentPermissionNodeKey.value = data?.id || ''
}

const submitPermission = async () => {
  const keys = permissionTreeRef.value?.getCheckedKeys(false) || []
  if (currentPermissionRole.value) {
    try {
      await assignRoleResources(currentPermissionRole.value.id, keys)
      permissionDialogVisible.value = false
      ElMessage.success('权限已更新')
      loadRoles()
    } catch (e) {
      console.error(e)
    }
  }
}

const onDeleteRole = async (row) => {
  if (!row) return
  try {
    await ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    loadRoles()
  } catch {}
}
</script>

<style scoped>
.role-management-view {
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

.role-table :deep(.el-table__header) th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 700;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.add-role-form :deep(.el-input),
.add-role-form :deep(.el-select),
.add-role-form :deep(.el-textarea__inner) {
  width: 100%;
}
.edit-role-form :deep(.el-input),
.edit-role-form :deep(.el-select),
.edit-role-form :deep(.el-textarea__inner) {
  width: 100%;
}
.code-disabled :deep(.el-input__inner) {
  cursor: default;
  user-select: none;
  pointer-events: none;
}

.permission-dialog-body {
  min-height: 340px;
}

.permission-tree :deep(.el-tree-node__content) {
  height: 36px;
  border-radius: 6px;
}

.permission-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #f3f8ff;
}
</style>
