<template>
  <div class="robot-list-view">
    <div class="page-title">机器人列表</div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-value text-black">{{ totalCount }}</div>
        <div class="stat-label">总机器人数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-green">{{ onlineCount }}</div>
        <div class="stat-label">在线</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-orange">{{ workingCount }}</div>
        <div class="stat-label">工作中</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-red">{{ offlineCount }}</div>
        <div class="stat-label">离线</div>
      </div>
    </div>

    <el-card shadow="never" class="content-card">
      <div class="action-bar">
        <el-button type="primary">新增机器人</el-button>
      </div>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="机器人名称:">
          <el-input v-model="searchForm.name" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="机器人编码:">
          <el-input v-model="searchForm.code" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="状态:">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 150px">
            <el-option label="在线" value="online" />
            <el-option label="工作中" value="working" />
            <el-option label="离线" value="offline" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadClients">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="pagedClients" stripe class="client-table">
        <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" />
        <el-table-column prop="code" label="机器人编码" min-width="150" />
        <el-table-column prop="name" label="机器人名称" min-width="150" />
        <el-table-column prop="type" label="类型" min-width="120" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small" effect="light">
              {{ statusLabelMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentTaskId" label="当前任务ID" min-width="120" />
        <el-table-column prop="lastHeartbeat" label="最后心跳" min-width="150" />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="onViewDetail(row)">查看</el-button>
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
          :total="filteredClients.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ensureSeeded, rpaStore } from '../stores/rpaMockStore'

const searchForm = reactive({
  name: '',
  code: '',
  status: ''
})

const appliedSearch = reactive({
  name: '',
  code: '',
  status: ''
})

const currentPage = ref(1)
const pageSize = ref(10)

const statusTypeMap = {
  online: 'success',
  offline: 'info',
  working: 'warning'
}

const statusLabelMap = {
  online: '在线',
  offline: '离线',
  working: '工作中'
}

const clients = ref([])

const initClients = () => {
  ensureSeeded()
  clients.value = rpaStore.robots
}

const totalCount = computed(() => clients.value.length)
const onlineCount = computed(() => clients.value.filter((c) => c.status === 'online').length)
const workingCount = computed(() => clients.value.filter((c) => c.status === 'working').length)
const offlineCount = computed(() => clients.value.filter((c) => c.status === 'offline').length)

const filteredClients = computed(() => {
  const name = (appliedSearch.name || '').trim()
  const code = (appliedSearch.code || '').trim()
  const status = (appliedSearch.status || '').trim()

  return clients.value.filter((c) => {
    const okName = !name || String(c.name || '').includes(name)
    const okCode = !code || String(c.code || '').includes(code)
    const okStatus = !status || c.status === status
    return okName && okCode && okStatus
  })
})

const pagedClients = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredClients.value.slice(start, end)
})

const indexMethod = (index) => (currentPage.value - 1) * pageSize.value + index + 1

function loadClients() {
  appliedSearch.name = searchForm.name
  appliedSearch.code = searchForm.code
  appliedSearch.status = searchForm.status
  currentPage.value = 1
}

function onReset() {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.status = ''

  appliedSearch.name = ''
  appliedSearch.code = ''
  appliedSearch.status = ''

  currentPage.value = 1
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

function onViewDetail(row) {
  ElMessage.info('查看详情: ' + row.name)
}

function onEdit(row) {
  ElMessage.info('编辑: ' + row.name)
}

function onDelete(row) {
  ElMessageBox.confirm(`确定要删除机器人 ${row.name} 吗？`, '提示', { type: 'warning' }).then(() => {
    ElMessage.success('删除成功')
  }).catch(() => {})
}

onMounted(initClients)
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
