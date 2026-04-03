<template>
  <div class="resource-management-container">
    <div class="page-title">资源管理</div>

    <el-card class="content-card" shadow="never">
      <div class="action-bar">
        <el-button type="primary" class="add-btn" @click="openAddDialog">新增资源</el-button>
      </div>
      
      <div class="search-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="资源名称：">
            <el-input v-model="searchForm.name" placeholder="请输入" clearable />
          </el-form-item>
          <el-form-item label="资源类型：">
            <el-select v-model="searchForm.type" placeholder="请选择" clearable class="type-select">
              <el-option label="菜单" value="MENU" />
              <el-option label="按钮" value="BUTTON" />
              <el-option label="API" value="API" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table
        :data="filteredTableData"
        style="width: 100%"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        default-expand-all
      >
        <el-table-column prop="resourceName" label="资源名称" min-width="180" />
        <el-table-column prop="resourceCode" label="资源编码" min-width="150" />
        <el-table-column prop="resourceType" label="资源类型" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.resourceType === 'MENU' ? 'primary' : row.resourceType === 'BUTTON' ? 'info' : 'warning'" plain size="small" class="custom-tag">
              {{ typeLabelMap[row.resourceType] || row.resourceType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="routePath" label="路径/URL" min-width="180" />
        <el-table-column prop="icon" label="图标" min-width="100" />
        <el-table-column prop="sortOrder" label="排序" min-width="80" align="center" />
        <el-table-column prop="status" label="状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" plain size="small" class="custom-tag danger-tag">
              {{ statusLabelMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog v-model="addDialogVisible" title="新增资源" width="720px" :close-on-click-modal="false">
        <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="90px" class="add-resource-form">
          <el-form-item label="父级资源" prop="parentId">
            <el-tree-select
              v-model="addForm.parentId"
              class="parent-tree-select"
              :data="parentTreeDataForAdd"
              :props="{ value: 'id', label: 'label', children: 'children' }"
              node-key="id"
              check-strictly
              default-expand-all
              highlight-current
              :current-node-key="addForm.parentId"
              :expand-on-click-node="false"
              clearable
              popper-class="parent-tree-popper"
              placeholder="请选择父级资源"
            />
          </el-form-item>
          <el-form-item label="资源编码" prop="resourceCode" required>
            <el-input v-model="addForm.resourceCode" maxlength="64" show-word-limit />
          </el-form-item>
          <el-form-item label="资源名称" prop="resourceName" required>
            <el-input v-model="addForm.resourceName" maxlength="100" show-word-limit />
          </el-form-item>
          <el-form-item label="资源类型" prop="resourceType" required>
            <el-select v-model="addForm.resourceType" placeholder="请选择" style="width: 100%">
              <el-option label="菜单" value="MENU" />
              <el-option label="按钮" value="BUTTON" />
              <el-option label="API" value="API" />
            </el-select>
          </el-form-item>
          <el-form-item label="路径/URL" prop="routePath">
            <el-input v-model="addForm.routePath" maxlength="255" show-word-limit />
          </el-form-item>
          <el-form-item label="图标" prop="icon">
            <el-input v-model="addForm.icon" placeholder="例如: User" maxlength="100" show-word-limit />
          </el-form-item>
          <el-form-item label="排序" prop="sortOrder">
            <el-input-number v-model="addForm.sortOrder" :min="0" :controls="true" controls-position="right" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="addForm.status">
              <el-radio :label="1">启用</el-radio>
              <el-radio :label="0">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAdd">确定</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="editDialogVisible" title="编辑资源" width="720px" :close-on-click-modal="false">
        <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="90px" class="edit-resource-form">
          <el-form-item label="父级资源" prop="parentId">
            <el-tree-select
              v-model="editForm.parentId"
              class="parent-tree-select"
              :data="parentTreeData"
              :props="{ value: 'id', label: 'label', children: 'children' }"
              node-key="id"
              check-strictly
              default-expand-all
              highlight-current
              :current-node-key="editForm.parentId"
              :expand-on-click-node="false"
              clearable
              popper-class="parent-tree-popper"
              placeholder="请选择"
            />
          </el-form-item>
          <el-form-item label="资源编码" prop="resourceCode" required>
            <el-input v-model="editForm.resourceCode" disabled class="code-disabled" />
          </el-form-item>
          <el-form-item label="资源名称" prop="resourceName" required>
            <el-input v-model="editForm.resourceName" maxlength="100" show-word-limit />
          </el-form-item>
          <el-form-item label="资源类型" prop="resourceType">
            <el-select v-model="editForm.resourceType" placeholder="请选择" style="width: 100%">
              <el-option label="菜单" value="MENU" />
              <el-option label="按钮" value="BUTTON" />
              <el-option label="API" value="API" />
            </el-select>
          </el-form-item>
          <el-form-item label="路径/URL" prop="routePath">
            <el-input v-model="editForm.routePath" maxlength="255" show-word-limit />
          </el-form-item>
          <el-form-item label="图标" prop="icon">
            <el-input v-model="editForm.icon" maxlength="100" show-word-limit />
          </el-form-item>
          <el-form-item label="排序" prop="sortOrder">
            <el-input-number v-model="editForm.sortOrder" :min="0" :controls="true" controls-position="right" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="editForm.status">
              <el-radio :label="1">启用</el-radio>
              <el-radio :label="0">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit">确定</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getResources, createResource, updateResource, deleteResource } from '../api/system'

const searchForm = reactive({
  name: '',
  type: ''
})

const appliedSearch = reactive({
  name: '',
  type: ''
})

const typeLabelMap = {
  MENU: '菜单',
  BUTTON: '按钮',
  API: 'API'
}

const statusLabelMap = {
  1: '启用',
  0: '禁用'
}

const tableData = ref([])

const normalizeResource = (r) => {
  if (!r) return null
  const id = r.id
  const parentId = r.parentId ?? r.parent_id ?? null
  const node = {
    id,
    parentId,
    resourceCode: r.resourceCode ?? r.resource_code ?? r.code ?? '',
    resourceName: r.resourceName ?? r.resource_name ?? r.name ?? r.label ?? '',
    resourceType: r.resourceType ?? r.resource_type ?? r.type ?? '',
    routePath: r.routePath ?? r.route_path ?? r.url ?? '',
    icon: r.icon ?? '',
    sortOrder: r.sortOrder ?? r.sort_order ?? r.sort ?? 0,
    isHidden: r.isHidden ?? r.is_hidden ?? 0,
    status: r.status ?? 1
  }
  if (Array.isArray(r.children) && r.children.length) {
    node.children = r.children.map(normalizeResource).filter(Boolean)
  }
  return node
}

const sortTree = (nodes) => {
  if (!Array.isArray(nodes)) return nodes
  nodes.sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0))
  nodes.forEach((n) => sortTree(n.children))
  return nodes
}

const buildTree = (flat) => {
  const nodes = flat.map(normalizeResource).filter(Boolean)
  const byId = new Map()
  nodes.forEach((n) => {
    n.children = []
    byId.set(n.id, n)
  })
  const roots = []
  nodes.forEach((n) => {
    const pid = n.parentId
    if (pid === null || pid === undefined || pid === 0) {
      roots.push(n)
      return
    }
    const parent = byId.get(pid)
    if (!parent) {
      roots.push(n)
      return
    }
    parent.children.push(n)
  })
  return sortTree(roots)
}

const loadResources = async () => {
  try {
    const res = await getResources()
    const data = res?.data
    const rawList = Array.isArray(data) ? data : Array.isArray(data?.list) ? data.list : []
    const normalized = rawList.map(normalizeResource).filter(Boolean)
    const hasChildren = normalized.some((n) => Array.isArray(n.children) && n.children.length)
    tableData.value = hasChildren ? sortTree(normalized) : buildTree(rawList)
  } catch (error) {
    console.error('Failed to load resources:', error)
  }
}

const handleSearch = () => {
  appliedSearch.name = (searchForm.name || '').trim()
  appliedSearch.type = searchForm.type || ''
}

const resetSearch = () => {
  searchForm.name = ''
  searchForm.type = ''
  appliedSearch.name = ''
  appliedSearch.type = ''
}

const addDialogVisible = ref(false)
const addFormRef = ref(null)

const addForm = reactive({
  parentId: '',
  resourceCode: '',
  resourceName: '',
  resourceType: 'MENU',
  routePath: '',
  icon: '',
  sortOrder: 0,
  status: 1
})

const addRules = reactive({
  resourceCode: [
    { required: true, message: '请输入资源编码', trigger: 'blur' },
    { max: 64, message: '资源编码长度不能超过64位', trigger: 'blur' }
  ],
  resourceName: [
    { required: true, message: '请输入资源名称', trigger: 'blur' },
    { max: 100, message: '资源名称长度不能超过100位', trigger: 'blur' }
  ],
  routePath: [{ max: 255, message: '路径/URL长度不能超过255位', trigger: 'blur' }],
  icon: [{ max: 100, message: '图标长度不能超过100位', trigger: 'blur' }]
})

const openAddDialog = () => {
  addForm.parentId = ''
  addForm.resourceCode = ''
  addForm.resourceName = ''
  addForm.resourceType = 'MENU'
  addForm.routePath = ''
  addForm.icon = ''
  addForm.sortOrder = 0
  addForm.status = 1
  addFormRef.value?.clearValidate?.()
  addDialogVisible.value = true
}

const submitAdd = async () => {
  if (!addFormRef.value) return
  await addFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      await createResource({
        parentId: addForm.parentId || null,
        resourceCode: addForm.resourceCode,
        resourceName: addForm.resourceName,
        resourceType: addForm.resourceType,
        routePath: addForm.routePath,
        icon: addForm.icon,
        sortOrder: addForm.sortOrder,
        isHidden: 0, // default
        status: addForm.status
      })
      addDialogVisible.value = false
      ElMessage.success('新增资源成功')
      loadResources()
    } catch (error) {
      const status = error?.response?.status
      const serverMsg = error?.response?.data?.message || error?.response?.data?.msg
      if (addForm.resourceCode && String(addForm.resourceCode).length > 64) {
        ElMessage.error('资源编码长度不能超过64位')
      } else if (addForm.resourceName && String(addForm.resourceName).length > 100) {
        ElMessage.error('资源名称长度不能超过100位')
      } else if (addForm.routePath && String(addForm.routePath).length > 255) {
        ElMessage.error('路径/URL长度不能超过255位')
      } else if (addForm.icon && String(addForm.icon).length > 100) {
        ElMessage.error('图标长度不能超过100位')
      } else if (status) {
        ElMessage.error(serverMsg || '新增资源失败')
      } else {
        ElMessage.error(serverMsg || error?.message || '新增资源失败')
      }
    }
  })
}

const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editTarget = ref(null)
const originalParentId = ref(0)

const editForm = reactive({
  id: 0,
  parentId: 0,
  resourceCode: '',
  resourceName: '',
  resourceType: 'MENU',
  routePath: '',
  icon: '',
  sortOrder: 0,
  status: 1
})

const editRules = reactive({
  resourceCode: [
    { required: true, message: '请输入资源编码', trigger: 'blur' },
    { max: 64, message: '资源编码长度不能超过64位', trigger: 'blur' }
  ],
  resourceName: [
    { required: true, message: '请输入资源名称', trigger: 'blur' },
    { max: 100, message: '资源名称长度不能超过100位', trigger: 'blur' }
  ],
  routePath: [{ max: 255, message: '路径/URL长度不能超过255位', trigger: 'blur' }],
  icon: [{ max: 100, message: '图标长度不能超过100位', trigger: 'blur' }]
})

const traverse = (nodes, cb, depth = 0) => {
  for (const n of nodes) {
    cb(n, depth)
    if (Array.isArray(n.children) && n.children.length) traverse(n.children, cb, depth + 1)
  }
}

const findNodeById = (nodes, id) => {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const found = findNodeById(n.children, id)
      if (found) return found
    }
  }
  return null
}

const collectDescendantIds = (node) => {
  const ids = []
  if (!node?.children) return ids
  traverse(node.children, (n) => ids.push(n.id))
  return ids
}

const parentTreeDataForAdd = computed(() => {
  const build = (nodes) => {
    const result = []
    for (const n of nodes) {
      const item = { id: n.id, label: n.resourceName }
      if (Array.isArray(n.children) && n.children.length) {
        const children = build(n.children)
        if (children.length) item.children = children
      }
      result.push(item)
    }
    return result
  }

  return [
    {
      id: 0,
      label: '根节点',
      customClass: 'root-node',
      children: build(tableData.value)
    }
  ]
})

const parentTreeData = computed(() => {
  const currentId = editForm.id
  const currentNode = currentId ? findNodeById(tableData.value, currentId) : null
  const blockedIds = new Set([currentId, ...collectDescendantIds(currentNode)])

  const build = (nodes) => {
    const result = []
    for (const n of nodes) {
      if (blockedIds.has(n.id)) continue
      const item = { id: n.id, label: n.resourceName }
      if (Array.isArray(n.children) && n.children.length) {
        const children = build(n.children)
        if (children.length) item.children = children
      }
      result.push(item)
    }
    return result
  }

  return [
    {
      id: 0,
      label: '根节点',
      customClass: 'root-node',
      children: build(tableData.value)
    }
  ]
})

const openEditDialog = (row) => {
  editTarget.value = row
  editForm.id = row.id
  editForm.parentId = row.parentId ?? 0
  editForm.resourceCode = row.resourceCode
  editForm.resourceName = row.resourceName
  editForm.resourceType = row.resourceType
  editForm.routePath = row.routePath
  editForm.icon = row.icon
  editForm.sortOrder = row.sortOrder
  editForm.status = row.status
  originalParentId.value = row.parentId ?? 0
  editFormRef.value?.clearValidate?.()
  editDialogVisible.value = true
}

const submitEdit = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    const nextParentId = editForm.parentId ?? 0
    const currentId = editForm.id
    if (nextParentId === currentId) {
      ElMessage.error('父级资源不能选择自身')
      return
    }
    const currentNode = currentId ? findNodeById(tableData.value, currentId) : null
    const descendants = new Set(collectDescendantIds(currentNode))
    if (descendants.has(nextParentId)) {
      ElMessage.error('父级资源不能选择子节点')
      return
    }

    if (editTarget.value) {
      try {
        await updateResource(currentId, {
          parentId: nextParentId || null,
          resourceCode: editForm.resourceCode,
          resourceName: editForm.resourceName,
          resourceType: editForm.resourceType,
          routePath: editForm.routePath,
          icon: editForm.icon,
          sortOrder: editForm.sortOrder,
          isHidden: 0,
          status: editForm.status
        })
        editDialogVisible.value = false
        ElMessage.success('编辑资源成功')
        loadResources()
      } catch (error) {
        const status = error?.response?.status
        const serverMsg = error?.response?.data?.message || error?.response?.data?.msg
        if (editForm.resourceCode && String(editForm.resourceCode).length > 64) {
          ElMessage.error('资源编码长度不能超过64位')
        } else if (editForm.resourceName && String(editForm.resourceName).length > 100) {
          ElMessage.error('资源名称长度不能超过100位')
        } else if (editForm.routePath && String(editForm.routePath).length > 255) {
          ElMessage.error('路径/URL长度不能超过255位')
        } else if (editForm.icon && String(editForm.icon).length > 100) {
          ElMessage.error('图标长度不能超过100位')
        } else if (status) {
          ElMessage.error(serverMsg || '编辑资源失败')
        } else {
          ElMessage.error(serverMsg || error?.message || '编辑资源失败')
        }
      }
    }
  })
}

const handleDelete = (row) => {
  // 先从全局全量树里找这个节点，看它真实有没有子节点
  const realNode = findNodeById(tableData.value, row.id)
  if (realNode && realNode.children && realNode.children.length > 0) {
    ElMessage.warning('该资源包含子节点，无法直接删除')
    return
  }
  
  ElMessageBox.confirm('确定要删除该资源吗？', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      await deleteResource(row.id)
      ElMessage.success('删除成功')
      loadResources()
    } catch (e) {
      const status = e?.response?.status
      const serverMsg = e?.response?.data?.message || e?.response?.data?.msg
      if (status === 400 && serverMsg && serverMsg.includes('子')) {
        ElMessage.error(serverMsg)
      } else {
        ElMessage.error(serverMsg || '删除资源失败')
      }
      console.error(e)
    }
  }).catch(() => {})
}

const filterTree = (nodes) => {
  const keyword = (appliedSearch.name || '').trim()
  const type = (appliedSearch.type || '').trim()
  if (!keyword && !type) return nodes
  const kw = keyword.toLowerCase()
  const walk = (list) => {
    const out = []
    for (const n of list || []) {
      const name = String(n?.resourceName || '').toLowerCase()
      const selfMatch = (!kw || name.includes(kw)) && (!type || n?.resourceType === type)
      const children = Array.isArray(n?.children) ? walk(n.children) : []
      if (selfMatch || children.length) {
        const next = { ...n }
        if (children.length) next.children = children
        else delete next.children
        out.push(next)
      }
    }
    return out
  }
  return walk(nodes)
}

const filteredTableData = computed(() => filterTree(tableData.value))

onMounted(() => {
  loadResources()
})
</script>

<style scoped>
.resource-management-container {
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
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
}

.add-btn {
  background-color: #409eff;
  border-color: #409eff;
}

.search-section {
  background-color: #fcfcfc;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.search-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 20px;
}

.type-select {
  width: 200px;
}

.custom-tag {
  border-radius: 2px;
  padding: 0 8px;
}

.danger-tag {
  color: #f56c6c;
  background-color: #fef0f0;
  border-color: #fde2e2;
}

/* Adjust table header style */
:deep(.el-table th.el-table__cell) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 700;
}

.parent-tree-select {
  width: 100%;
}

:deep(.parent-tree-popper .el-tree-node__content) {
  height: 36px;
  border-radius: 6px;
}

:deep(.parent-tree-popper .el-tree-node.is-current > .el-tree-node__content) {
  background-color: #f5f7fa;
}

:deep(.parent-tree-popper .root-node > .el-tree-node__content) {
  background-color: transparent;
}

:deep(.parent-tree-popper .root-node > .el-tree-node__content .el-tree-node__label) {
  color: var(--el-color-primary);
  font-weight: 700;
}

:deep(.parent-tree-popper .root-node > .el-tree-node__content .el-tree-node__expand-icon) {
  display: none;
}

.code-disabled :deep(.el-input__inner) {
  cursor: default;
  user-select: none;
  pointer-events: none;
}
</style>
