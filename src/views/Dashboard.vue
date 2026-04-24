<template>
  <div class="dashboard-container">
    <div class="dashboard-hero">
      <div class="hero-left">
        <h2 class="hero-title">欢迎回来，{{ currentUser?.name || '系统管理员' }}！</h2>
        <p class="hero-desc">今天是 {{ todayText }}，系统运行正常</p>
      </div>
      <el-button class="hero-create-btn" @click="goToTaskPage">+ 创建任务</el-button>
    </div>

    <el-row :gutter="18" class="metric-row">
      <el-col :span="6" v-for="item in dashboardMetrics" :key="item.key">
        <el-card shadow="never" class="metric-card clickable" @click="goByMetric(item)">
          <div class="metric-header">
            <div :class="['metric-icon', item.color]">
              <el-icon><component :is="item.icon" /></el-icon>
            </div>
            <div class="metric-badge">{{ item.trend }}</div>
          </div>
          <div class="metric-label">{{ item.label }}</div>
          <div class="metric-value">{{ item.value }}</div>
          <div class="metric-sub">{{ item.subLabel }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div>
                <span class="title">任务执行趋势</span>
                <div class="sub-title">默认展示最近7天执行情况</div>
              </div>
              <div class="header-right">
                <span class="legend-item"><span class="dot blue"></span> 已完成</span>
                <span class="legend-item"><span class="dot purple"></span> 执行中</span>
                <span class="legend-item"><span class="dot dark"></span> 趋势</span>
                <el-select v-model="chartMode" size="small" class="range-select">
                  <el-option label="最近12个月" value="12m" />
                  <el-option label="最近7天" value="7d" />
                </el-select>
              </div>
            </div>
          </template>
          <div ref="mainChartRef" class="main-chart"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="quick-card">
          <template #header>
            <div class="card-header">
              <span class="title">快捷入口</span>
            </div>
          </template>
          <div class="quick-list">
            <div class="quick-item" @click="goToTaskPage">
              <div class="quick-icon purple"><el-icon><Plus /></el-icon></div>
              <div class="quick-content">
                <div class="quick-title">创建任务</div>
                <div class="quick-desc">快速创建新的RPA任务</div>
              </div>
              <el-icon class="quick-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="quick-item" @click="goToFlowPage">
              <div class="quick-icon green"><el-icon><Connection /></el-icon></div>
              <div class="quick-content">
                <div class="quick-title">流程定义</div>
                <div class="quick-desc">定义和管理RPA流程</div>
              </div>
              <el-icon class="quick-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="quick-item" @click="goToClientPage">
              <div class="quick-icon pink"><el-icon><Monitor /></el-icon></div>
              <div class="quick-content">
                <div class="quick-title">机器人列表</div>
                <div class="quick-desc">查看和管理机器人</div>
              </div>
              <el-icon class="quick-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="quick-item" @click="goToDataQueryPage">
              <div class="quick-icon cyan"><el-icon><Document /></el-icon></div>
              <div class="quick-content">
                <div class="quick-title">数据查询</div>
                <div class="quick-desc">查询已处理的数据</div>
              </div>
              <el-icon class="quick-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="title">最近任务</span>
          <el-link type="primary" :underline="false" @click="goToTaskPage">查看全部 &gt;</el-link>
        </div>
      </template>
      <el-table :data="recentTasks" style="width: 100%" class="task-table" v-loading="loading">
        <el-table-column prop="code" label="任务编码" width="220">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" class="task-code-link" @click="goToTaskDetail(row)">{{ row.code }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="任务名称" min-width="160">
          <template #default="{ row }">{{ row.name || row.processName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="robotName" label="机器人名称" min-width="180">
          <template #default="{ row }">
            {{ row.robotName || getRobotNameFromList(row.robotId) || row.robotId || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small" effect="plain" class="status-tag">
              {{ statusLabelMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { ArrowRight, Connection, Document, Monitor, Plus } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { getUser, USER_CHANGED_EVENT } from '../services/auth'
import { getProcessOptions, getRobotOptions, getTaskExecutions, getTaskList } from '../api/task'
import { formatLocalDateTime } from '../utils/datetime'

const router = useRouter()
const currentUser = ref(getUser())
const loading = ref(false)
const mainChartRef = ref(null)
const pieChartRef = ref(null)
let mainChart = null
let pieChart = null
const processList = ref([])
const robotList = ref([])
const tasks = ref([])
const executions = ref([])

const statusTypeMap = {
  running: 'warning',
  RUNNING: 'warning',
  completed: 'success',
  SUCCESS: 'success',
  idle: 'info',
  PENDING: 'info',
  error: 'danger',
  FAILED: 'danger'
}

const statusLabelMap = {
  running: '执行中',
  RUNNING: '执行中',
  completed: '已完成',
  SUCCESS: '已完成',
  idle: '待执行',
  PENDING: '待执行',
  error: '失败',
  FAILED: '失败'
}

const unwrapPayload = (payload) => {
  const data = payload?.data ?? payload
  if (Array.isArray(data)) return { list: data, total: data.length }
  if (!data || typeof data !== 'object') return { list: [], total: 0 }
  const list = data.list ?? data.records ?? data.rows ?? data.items ?? data.data ?? []
  return {
    list: Array.isArray(list) ? list : [],
    total: data.total ?? data.count ?? data.totalCount ?? (Array.isArray(list) ? list.length : 0)
  }
}

const normalizeTask = (t = {}) => ({
  id: t.id ?? t.taskId ?? '',
  code: t.taskCode ?? t.code ?? (t.id ? `TASK_${t.id}` : ''),
  name: t.taskName ?? t.name ?? '',
  processId: t.processId ?? t.flowId ?? '',
  processName: t.processName ?? t.flowName ?? '',
  robotId: t.robotId ?? t.robot_code ?? t.robotCode ?? t.clientId ?? t.client_id ?? t.robot ?? '',
  robotName: t.robotName ?? t.robot_name ?? t.clientName ?? t.client_name ?? '',
  status: t.status ?? 'PENDING',
  createTime: formatLocalDateTime(t.createTime ?? t.createdAt ?? t.created_at ?? ''),
  startTime: formatLocalDateTime(t.startTime ?? t.startedAt ?? ''),
  endTime: formatLocalDateTime(t.endTime ?? t.finishedAt ?? '')
})

const dashboardMetrics = computed(() => [
  { key: 'robots', label: '机器人总数', value: robotList.value.length, subLabel: '已配置机器人数量', trend: '总量', color: 'blue', icon: Monitor, route: '/client' },
  { key: 'processes', label: '流程总数', value: processList.value.length, subLabel: '流程定义数量', trend: '总量', color: 'green', icon: Connection, route: '/flow/list' },
  { key: 'data', label: '数据总量', value: executions.value.length, subLabel: '执行记录数量', trend: '总量', color: 'orange', icon: Document, route: '/data/query' },
  { key: 'tasks', label: '任务总数', value: tasks.value.length, subLabel: '当前任务数量', trend: '总量', color: 'blue', icon: Document, route: '/task/list' }
])

const getRobotNameFromList = (robotId) => {
  if (!robotId) return ''
  const id = String(robotId)
  const robot = robotList.value.find((item) => {
    const rid = item?.id ?? item?.value ?? item?.robotId
    const rcode = item?.robotCode ?? item?.code
    return String(rid ?? '') === id || String(rcode ?? '') === id
  })
  return robot?.robotName || robot?.name || robot?.label || ''
}

const recentTasks = computed(() => tasks.value.slice(0, 6))
const chartMode = ref('7d')
const chartTitleMap = {
  '7d': '最近7天任务执行趋势',
  '12m': '最近12个月任务执行趋势'
}

const formatToday = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}年${month}月${day}日`
}

const todayText = formatToday()

const getExecutionTime = (item = {}) => item.startTime || item.endTime || item.createTime || item.updatedAt || item.finishedAt || ''

const buildRecentRangeChart = () => {
  const rangeDays = chartMode.value === '7d' ? 7 : 30
  const dayLabels = Array.from({ length: rangeDays }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - ((rangeDays - 1) - index))
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  const now = new Date()
  const buckets = Array.from({ length: rangeDays }, () => ({ completed: 0, running: 0, total: 0 }))
  executions.value.forEach((item) => {
    const timeText = getExecutionTime(item)
    const time = timeText ? new Date(timeText) : null
    if (!time || Number.isNaN(time.getTime())) return
    const diffDays = Math.floor((now - time) / (1000 * 60 * 60 * 24))
    if (diffDays < 0 || diffDays > rangeDays - 1) return
    const index = (rangeDays - 1) - diffDays
    const bucket = buckets[index]
    bucket.total += 1
    if (item.status === 'SUCCESS' || item.status === 'completed') bucket.completed += 1
    else if (item.status === 'RUNNING' || item.status === 'running') bucket.running += 1
  })
  return { labels: dayLabels, completedData: buckets.map((item) => item.completed), runningData: buckets.map((item) => item.running), trendData: buckets.map((item) => item.total) }
}

const buildMonthlyChart = () => {
  const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const now = new Date()
  const currentYear = now.getFullYear()
  const monthStats = Array.from({ length: 12 }, () => ({ completed: 0, running: 0, total: 0 }))
  executions.value.forEach((item) => {
    const timeText = getExecutionTime(item)
    const time = timeText ? new Date(timeText) : null
    if (!time || Number.isNaN(time.getTime()) || time.getFullYear() !== currentYear) return
    const bucket = monthStats[time.getMonth()]
    bucket.total += 1
    if (item.status === 'SUCCESS' || item.status === 'completed') bucket.completed += 1
    else if (item.status === 'RUNNING' || item.status === 'running') bucket.running += 1
  })
  return { labels: monthLabels, completedData: monthStats.map((item) => item.completed), runningData: monthStats.map((item) => item.running), trendData: monthStats.map((item) => item.total) }
}

const renderCharts = () => {
  const chartData = chartMode.value === '7d' ? buildRecentRangeChart() : buildMonthlyChart()
  const hasRealData = chartData.trendData.some((value) => value > 0)
  const rangeLabel = chartMode.value === '7d' ? '最近7天任务执行趋势' : '最近12个月任务执行趋势'
  if (mainChartRef.value) {
    if (!mainChart) mainChart = echarts.init(mainChartRef.value)
    mainChart.setOption({
      title: { text: rangeLabel, left: 8, top: 2, textStyle: { fontSize: 14, fontWeight: 600, color: '#111827' } },
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(17, 24, 39, 0.92)', borderWidth: 0, textStyle: { color: '#fff' } },
      grid: { left: '4%', right: '4%', bottom: '10%', top: '18%', containLabel: true },
      legend: { top: 2, right: 8, icon: 'roundRect', itemWidth: 10, itemHeight: 10, textStyle: { color: '#64748b' } },
      xAxis: {
        type: 'category',
        data: chartData.labels,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#64748b', interval: 0, rotate: chartMode.value === '7d' ? 0 : 0 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } },
        axisLabel: { color: '#94a3b8' }
      },
      series: [
        { name: '已完成', type: 'bar', data: hasRealData ? chartData.completedData : chartData.labels.map(() => 0), barWidth: chartMode.value === '7d' ? 18 : 12, itemStyle: { color: '#7dd3fc', borderRadius: [8, 8, 0, 0] }, emphasis: { focus: 'series' } },
        { name: '执行中', type: 'bar', data: hasRealData ? chartData.runningData : chartData.labels.map(() => 0), barWidth: chartMode.value === '7d' ? 18 : 12, itemStyle: { color: '#c4b5fd', borderRadius: [8, 8, 0, 0] }, emphasis: { focus: 'series' } },
        { name: '趋势', type: 'line', data: hasRealData ? chartData.trendData : chartData.labels.map(() => 0), smooth: true, symbol: 'circle', symbolSize: 7, lineStyle: { width: 3, color: '#111827' }, itemStyle: { color: '#111827' }, areaStyle: { color: 'rgba(17, 24, 39, 0.06)' } }
      ]
    }, true)
  }
  if (pieChartRef.value) {
    if (!pieChart) pieChart = echarts.init(pieChartRef.value)
    const statusCount = { SUCCESS: 0, RUNNING: 0, PENDING: 0, FAILED: 0 }
    executions.value.forEach((item) => {
      if (statusCount[item.status] !== undefined) statusCount[item.status] += 1
      else statusCount.PENDING += 1
    })
    pieChart.setOption({
      tooltip: { trigger: 'item' },
      series: [{ name: '任务状态', type: 'pie', radius: ['48%', '72%'], center: ['50%', '48%'], label: { show: false }, itemStyle: { borderColor: '#fff', borderWidth: 2 }, data: [
        { value: statusCount.SUCCESS, name: '已完成', itemStyle: { color: '#22c55e' } },
        { value: statusCount.RUNNING, name: '执行中', itemStyle: { color: '#f59e0b' } },
        { value: statusCount.PENDING, name: '待执行', itemStyle: { color: '#94a3b8' } },
        { value: statusCount.FAILED, name: '失败', itemStyle: { color: '#ef4444' } }
      ] }]
    }, true)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const [processesRes, robotsRes, tasksRes, executionsRes] = await Promise.all([
      getProcessOptions(),
      getRobotOptions(),
      getTaskList({ page: 1, size: 50 }),
      getTaskExecutions({ page: 1, size: 200 })
    ])
    processList.value = unwrapPayload(processesRes).list
    robotList.value = unwrapPayload(robotsRes).list
    tasks.value = unwrapPayload(tasksRes).list.map(normalizeTask)
    executions.value = unwrapPayload(executionsRes).list
    renderCharts()
  } catch (err) {
    console.error('加载首页数据失败:', err)
    processList.value = []
    robotList.value = []
    tasks.value = []
    executions.value = []
    loadCharts()
  } finally {
    loading.value = false
  }
}

const onUserChanged = (e) => {
  currentUser.value = e?.detail ?? getUser()
}

const handleResize = () => {
  mainChart?.resize()
  pieChart?.resize()
}

const goToTaskPage = () => router.push('/task/list')
const goToFlowPage = () => router.push('/flow/list')
const goToClientPage = () => router.push('/client')
const goToDataQueryPage = () => router.push('/data/query')
const goByMetric = (item) => {
  if (!item?.route) return
  router.push(item.route)
}
const goToTaskDetail = (row) => {
  if (!row?.code) return
  router.push({ path: '/task/list', query: { taskCode: row.code } })
}

watch(chartMode, () => renderCharts())
watch(executions, () => renderCharts(), { deep: true })

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
  window.addEventListener(USER_CHANGED_EVENT, onUserChanged)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener(USER_CHANGED_EVENT, onUserChanged)
  mainChart?.dispose()
  pieChart?.dispose()
})
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  background: linear-gradient(180deg, #fcfdff 0%, #f5f7fb 100%);
  min-height: 100%;
}

.dashboard-hero {
  margin-bottom: 22px;
  padding: 26px 24px;
  border-radius: 8px;
  background: linear-gradient(120deg, #4f6eea 0%, #6b5fd3 52%, #7f49b5 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.2);
}

.hero-left {
  min-width: 0;
}

.hero-title {
  margin: 0 0 10px;
  font-size: 38px;
  line-height: 1.15;
  font-weight: 800;
  color: #ffffff;
}

.hero-desc {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  line-height: 1.5;
}

.hero-create-btn {
  border: none;
  background: linear-gradient(180deg, #4bb6ff 0%, #2f9df6 100%);
  color: #fff;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 6px;
}

.hero-create-btn:hover {
  opacity: 0.94;
}

.metric-row,
.chart-row {
  margin-bottom: 20px;
}

.metric-card,
.chart-card,
.pie-card,
.table-card {
  border-radius: 20px;
  border: none;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
}

.metric-card {
  min-height: 168px;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  border: 1px solid transparent;
}

.metric-card:hover {
  transform: translateY(-6px);
  border-color: #dbeafe;
  box-shadow: 0 18px 34px rgba(59, 130, 246, 0.14);
}

.metric-card:active {
  transform: translateY(-2px);
}

.metric-card:hover .metric-icon {
  transform: scale(1.06);
}

.metric-card:hover .metric-value {
  color: #2563eb;
}

.metric-card:hover .metric-badge {
  background: #eff6ff;
  color: #2563eb;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.metric-icon {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: transform 0.25s ease;
}

.metric-icon.blue { background: #eff6ff; color: #3b82f6; }
.metric-icon.green { background: #f0fdf4; color: #22c55e; }
.metric-icon.orange { background: #fff7ed; color: #f59e0b; }

.metric-badge {
  padding: 4px 10px;
  border-radius: 999px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
}

.metric-label {
  color: #94a3b8;
  font-size: 13px;
  margin-top: 4px;
}

.metric-value {
  margin-top: 8px;
  font-size: 34px;
  font-weight: 700;
  color: #111827;
}

.metric-sub {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 12px;
}

.chart-card :deep(.el-card__header),
.quick-card :deep(.el-card__header),
.table-card :deep(.el-card__header) {
  border-bottom: 1px solid #eef2f7;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 28px;
  color: #111827;
}

.card-header .title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.card-header .sub-title {
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
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
  margin-left: 14px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.dot.blue { background-color: #7dd3fc; }
.dot.purple { background-color: #c4b5fd; }
.dot.dark { background-color: #111827; }

.range-select {
  width: 136px;
  margin-left: 16px;
}

.quick-card {
  border-radius: 20px;
  border: none;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
}

.quick-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.quick-item {
  display: flex;
  align-items: center;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  transition: all 0.2s ease;
  cursor: pointer;
}

.quick-item:hover {
  border-color: #bfdbfe;
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.12);
  transform: translateY(-2px);
}

.quick-item:first-child {
  background: linear-gradient(135deg, #f8fbff 0%, #f3f8ff 100%);
  border-color: #93c5fd;
}

.quick-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  margin-right: 12px;
  flex-shrink: 0;
}

.quick-icon.purple { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); }
.quick-icon.green { background: linear-gradient(135deg, #22c55e 0%, #34d399 100%); }
.quick-icon.pink { background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); }
.quick-icon.cyan { background: linear-gradient(135deg, #06b6d4 0%, #38bdf8 100%); }

.quick-content {
  flex: 1;
  min-width: 0;
}

.quick-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2px;
}

.quick-desc {
  font-size: 13px;
  color: #94a3b8;
}

.quick-arrow {
  color: #cbd5e1;
  font-size: 18px;
}

.main-chart {
  height: 360px;
  width: 100%;
}

.table-card {
  margin-top: 20px;
}

.task-table :deep(.el-table__header) th {
  background: #f8fafc;
  color: #111827;
  font-weight: 600;
}

.task-code-link {
  font-weight: 600;
}

:deep(.el-card__body) {
  padding: 18px;
}

:deep(.el-card__header) {
  padding: 18px 20px;
}

:deep(.el-select .el-input__wrapper),
:deep(.el-button.is-plain) {
  border-radius: 12px;
}
</style>
