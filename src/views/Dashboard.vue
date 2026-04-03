<template>
  <div class="dashboard-container">
    <el-row :gutter="24">
      <!-- Main Content Area (Left) -->
      <el-col :span="18">
        <!-- Welcome Section -->
        <div class="welcome-section">
          <div class="welcome-text">
            <h2>欢迎回来, 系统管理员! ✉️</h2>
          </div>
          <el-button type="warning" class="new-task-btn">+ 新建任务</el-button>
        </div>

        <!-- Task Count Chart Card -->
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="title">任务执行统计</span>
              <div class="header-right">
                <span class="legend-item"><span class="dot green"></span> 采集任务</span>
                <span class="legend-item"><span class="dot orange"></span> 处理任务</span>
                <span class="legend-item"><span class="dot black"></span> 总计</span>
                <el-select v-model="timeRange" size="small" style="width: 120px; margin-left: 16px;">
                  <el-option label="最近12个月" value="12m" />
                </el-select>
              </div>
            </div>
          </template>
          <div ref="mainChartRef" class="main-chart"></div>
        </el-card>

        <!-- Stat Cards Row -->
        <el-row :gutter="20" class="stat-row">
          <el-col :span="8">
            <el-card shadow="never" class="stat-small-card">
              <div class="stat-icon-circle blue">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="stat-info">
                <div class="label">机器人总数</div>
                <div class="value-row">
                  <span class="value">{{ stats.robots?.total || 0 }}</span>
                  <span class="trend up">📈</span>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="stat-small-card">
              <div class="stat-icon-circle green">
                <el-icon><Connection /></el-icon>
              </div>
              <div class="stat-info">
                <div class="label">流程总数</div>
                <div class="value-row">
                  <span class="value">{{ stats.flows?.total || 0 }}</span>
                  <span class="trend up">📈</span>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="stat-small-card">
              <div class="stat-icon-circle orange">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="label">数据总量</div>
                <div class="value-row">
                  <span class="value">{{ stats.data?.total || 0 }}</span>
                  <span class="trend down">📉</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- Recent Tasks Table (From Figure 1 Style) -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card shadow="never" class="table-card">
              <template #header>
                <div class="card-header">
                  <span class="title">最近任务</span>
                  <el-link type="primary" :underline="false">查看全部 ></el-link>
                </div>
              </template>
              <el-table :data="recentTasks" style="width: 100%" class="task-table">
                <el-table-column prop="code" label="任务编码" width="220">
                  <template #default="{ row }">
                    <el-link type="primary" :underline="false" class="task-code-link">{{ row.code }}</el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="流程名称" />
                <el-table-column prop="company" label="股票名称" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="statusTypeMap[row.status]" size="small" effect="plain" class="status-tag">
                      {{ statusLabelMap[row.status] }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间" width="180" />
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-col>

      <!-- Sidebar Area (Right) -->
      <el-col :span="6">
        <!-- User Profile Card -->
        <div class="user-profile">
          <el-avatar :size="48" :src="currentUser?.avatar || defaultAvatar" />
          <div class="user-info">
            <div class="name">{{ currentUser?.name || '系统管理员' }}</div>
            <div class="role">{{ currentUser?.role || '高级运维工程师' }}</div>
          </div>
          <div class="profile-actions">
            <el-icon><Message /></el-icon>
            <el-icon><Bell /></el-icon>
          </div>
        </div>

        <!-- Shortcuts Card (From Figure 1) -->
        <el-card shadow="never" class="shortcut-card">
          <template #header>
            <div class="card-header">
              <span>快捷入口</span>
            </div>
          </template>
          <div class="shortcut-list">
            <div class="shortcut-item">
              <div class="shortcut-icon blue"><el-icon><Plus /></el-icon></div>
              <div class="shortcut-info">
                <div class="title">创建任务</div>
                <div class="desc">快速创建新的RPA任务</div>
              </div>
              <el-icon class="arrow"><ArrowRight /></el-icon>
            </div>
            <div class="shortcut-item">
              <div class="shortcut-icon green"><el-icon><Connection /></el-icon></div>
              <div class="shortcut-info">
                <div class="title">流程定义</div>
                <div class="desc">定义和管理RPA流程</div>
              </div>
              <el-icon class="arrow"><ArrowRight /></el-icon>
            </div>
            <div class="shortcut-item">
              <div class="shortcut-icon pink"><el-icon><Setting /></el-icon></div>
              <div class="shortcut-info">
                <div class="title">机器人列表</div>
                <div class="desc">查看和管理机器人</div>
              </div>
              <el-icon class="arrow"><ArrowRight /></el-icon>
            </div>
            <div class="shortcut-item">
              <div class="shortcut-icon cyan"><el-icon><Search /></el-icon></div>
              <div class="shortcut-info">
                <div class="title">数据查询</div>
                <div class="desc">查询已处理的数据</div>
              </div>
              <el-icon class="arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>

        <!-- System Info Card (From Figure 1) -->
        <el-card shadow="never" class="system-card">
          <template #header>
            <div class="card-header">
              <span>系统信息</span>
            </div>
          </template>
          <div class="info-list">
            <div class="info-item">
              <span class="label">系统版本</span>
              <span class="value">{{ sysInfo.version }}</span>
            </div>
            <div class="info-item">
              <span class="label">运行时间</span>
              <span class="value">{{ sysInfo.uptime }}</span>
            </div>
            <div class="info-item">
              <span class="label">数据源</span>
              <span class="value">{{ sysInfo.datasource }}</span>
            </div>
            <div class="info-item">
              <span class="label">最后更新</span>
              <span class="value">{{ sysInfo.lastUpdate }}</span>
            </div>
          </div>
        </el-card>

        <!-- Status Overview Card (Back from Guru Style) -->
        <el-card shadow="never" class="pie-card">
          <template #header>
            <div class="card-header">
              <span>状态概览</span>
            </div>
          </template>
          <div ref="pieChartRef" class="pie-chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { 
  Monitor, Connection, Document, 
  Message, Bell, Plus, ArrowRight, 
  Setting, Search
} from '@element-plus/icons-vue'
import http from '../api/http'
import { getUser, USER_CHANGED_EVENT } from '../services/auth'

const defaultAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
const currentUser = ref(getUser())

const onUserChanged = (e) => {
  currentUser.value = e?.detail ?? getUser()
}

const stats = ref({})
const recentTasks = ref([])
const sysInfo = ref({})
const timeRange = ref('12m')
const mainChartRef = ref(null)
const pieChartRef = ref(null)
let mainChart = null
let pieChart = null

const statusTypeMap = {
  running: 'warning',
  completed: 'success',
  idle: 'info',
  error: 'danger'
}

const statusLabelMap = {
  running: '运行中',
  completed: '已完成',
  idle: '待执行',
  error: '失败'
}

const initCharts = async () => {
  // Main Chart (Bar + Line)
  if (mainChartRef.value) {
    mainChart = echarts.init(mainChartRef.value)
    const { data } = await http.get('/stats/task-chart')
    const chartData = data.data

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: chartData.months,
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: [
        {
          type: 'value',
          axisLine: { show: false },
          splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } }
        },
        {
          type: 'value',
          axisLine: { show: false },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '采集任务',
          type: 'bar',
          data: chartData.taskA,
          itemStyle: { color: '#bbf7d0', borderRadius: [4, 4, 0, 0] },
          barWidth: '20%'
        },
        {
          name: '处理任务',
          type: 'bar',
          data: chartData.taskB,
          itemStyle: { color: '#fed7aa', borderRadius: [4, 4, 0, 0] },
          barWidth: '20%'
        },
        {
          name: '总计',
          type: 'line',
          yAxisIndex: 1,
          data: chartData.total,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#374151', width: 3 },
          itemStyle: { color: '#374151' }
        }
      ]
    }
    mainChart.setOption(option)
  }

  // Pie Chart
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
    const statusData = stats.value.status || {}
    const option = {
      tooltip: { trigger: 'item' },
      legend: {
        orient: 'vertical',
        right: '10%',
        top: 'center',
        itemWidth: 8,
        itemHeight: 8,
        icon: 'circle'
      },
      series: [
        {
          name: '任务状态',
          type: 'pie',
          radius: ['50%', '80%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: '14', fontWeight: 'bold' }
          },
          data: [
            { value: statusData.completed || 0, name: '已完成', itemStyle: { color: '#bbf7d0' } },
            { value: statusData.running || 0, name: '运行中', itemStyle: { color: '#fed7aa' } },
            { value: statusData.idle || 0, name: '待执行', itemStyle: { color: '#e5e7eb' } },
            { value: statusData.error || 0, name: '失败', itemStyle: { color: '#fecaca' } }
          ]
        }
      ]
    }
    pieChart.setOption(option)
  }
}

const fetchData = async () => {
  try {
    const [statsRes, tasksRes, infoRes] = await Promise.all([
      http.get('/stats/overview'),
      http.get('/task/list'),
      http.get('/system/info')
    ])
    stats.value = statsRes.data.data
    recentTasks.value = tasksRes.data.data.list
    sysInfo.value = infoRes.data.data
    
    // Re-init charts after data fetched
    initCharts()
  } catch (err) {
    console.error(err)
  }
}

const handleResize = () => {
  mainChart?.resize()
  pieChart?.resize()
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
  window.addEventListener(USER_CHANGED_EVENT, onUserChanged)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener(USER_CHANGED_EVENT, onUserChanged)
})
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  background-color: #f8fafc;
  min-height: 100%;
}

/* Main Content Area */
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.welcome-text h2 {
  margin: 0;
  font-size: 24px;
  color: #1e293b;
}

.new-task-btn {
  background-color: #fde68a;
  border: none;
  color: #92400e;
  font-weight: 600;
  padding: 10px 20px;
}

.chart-card {
  border-radius: 16px;
  border: none;
  margin-bottom: 24px;
}

.chart-card :deep(.el-card__header) {
  border-bottom: none;
  padding-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.header-right {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #64748b;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-left: 16px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.dot.green { background-color: #bbf7d0; }
.dot.orange { background-color: #fed7aa; }
.dot.black { background-color: #374151; }

.main-chart {
  height: 350px;
  width: 100%;
}

.stat-row {
  margin-bottom: 24px;
}

.stat-small-card {
  border-radius: 16px;
  border: none;
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 16px;
}

.stat-icon-circle.blue { background-color: #eff6ff; color: #3b82f6; }
.stat-icon-circle.green { background-color: #f0fdf4; color: #22c55e; }
.stat-icon-circle.orange { background-color: #fff7ed; color: #f59e0b; }

.stat-info .label {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 4px;
}

.stat-info .value-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-info .value {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.stat-info .trend {
  font-size: 14px;
}

.table-card {
  border-radius: 16px;
  border: none;
}

.task-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-icon {
  width: 36px;
  height: 36px;
  background-color: #1e293b;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.task-detail .name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.task-detail .code {
  font-size: 12px;
  color: #94a3b8;
}

/* Sidebar Area */
.user-profile {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 24px;
}

.user-info {
  margin-left: 12px;
  flex: 1;
}

.user-info .name {
  font-weight: 600;
  color: #1e293b;
}

.user-info .role {
  font-size: 12px;
  color: #94a3b8;
}

.profile-actions {
  display: flex;
  gap: 12px;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
}

.shortcut-card, .system-card, .pie-card {
  border-radius: 16px;
  border: none;
  margin-bottom: 24px;
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.shortcut-item:hover {
  background-color: #f3f4f6;
  transform: translateY(-2px);
}

.shortcut-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 12px;
}

.shortcut-icon.blue { background-color: #eef2ff; color: #6366f1; }
.shortcut-icon.green { background-color: #f0fdf4; color: #22c55e; }
.shortcut-icon.pink { background-color: #fdf2f8; color: #ec4899; }
.shortcut-icon.cyan { background-color: #ecfeff; color: #06b6d4; }

.shortcut-info {
  flex: 1;
}

.shortcut-info .title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.shortcut-info .desc {
  font-size: 12px;
  color: #94a3b8;
}

.shortcut-item .arrow {
  color: #d1d5db;
}

.info-list {
  display: flex;
  flex-direction: column;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #64748b;
  font-size: 14px;
}

.info-item .value {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.pie-chart {
  height: 200px;
  width: 100%;
}
</style>
