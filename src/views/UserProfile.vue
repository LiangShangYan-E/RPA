<template>
  <div class="user-profile-container">
    <div class="page-header">
      <h2>个人中心</h2>
      <p class="subtitle">管理您的个人信息、查看资产统计及修改账户设置</p>
    </div>
    
    <el-row :gutter="24" class="main-profile-row">
      <!-- 左侧：身份与辅助工具区 (Identity & Tools) -->
      <el-col :span="8" class="left-sticky-col">
        <el-card shadow="never" class="profile-main-card">
          <div class="profile-header-bg"></div>
          <div class="profile-content">
            <div class="avatar-wrapper">
              <el-avatar :size="100" class="user-avatar" :src="avatarDisplaySrc" @click="openAvatarPicker">
                <el-icon :size="40"><User /></el-icon>
              </el-avatar>
              <div class="avatar-edit-overlay" @click.stop="openAvatarPicker">
                <el-icon><Camera /></el-icon>
              </div>
              <input
                ref="avatarInputRef"
                type="file"
                accept="image/*"
                style="display: none"
                @change="onAvatarFileChange"
              />
            </div>
            <h3 class="user-name">{{ userInfo.name }}</h3>
            <p class="user-role-text">{{ userInfo.role }}</p>
            
            <div class="info-details">
              <div class="detail-item">
                <el-icon><UserFilled /></el-icon>
                <span class="label">账号:</span>
                <span class="value">{{ userInfo.username }}</span>
              </div>
              <div class="detail-item">
                <el-icon><Message /></el-icon>
                <span class="label">邮箱:</span>
                <span class="value">{{ userInfo.email }}</span>
              </div>
              <div class="detail-item">
                <el-icon><Iphone /></el-icon>
                <span class="label">手机:</span>
                <span class="value">{{ userInfo.phone }}</span>
              </div>
              <div class="detail-item">
                <el-icon><Timer /></el-icon>
                <span class="label">加入于:</span>
                <span class="value">{{ userInfo.createTime }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <div class="left-blank-tools">
          <!-- 日历卡片 (Calendar Card) -->
          <el-card shadow="never" class="calendar-card">
            <el-calendar v-model="calendarValue" class="mini-calendar" />
          </el-card>
        </div>
      </el-col>
      
      <!-- 右侧：数据与设置 (Data & Settings Section) -->
      <el-col :span="16" class="right-content-col">
        <!-- 第一层：资产统计小卡片 -->
        <el-row :gutter="16" class="asset-row">
          <el-col :span="8">
            <div class="asset-card blue">
              <div class="asset-icon"><Monitor /></div>
              <div class="asset-info">
                <span class="asset-label">我的机器人</span>
                <span class="asset-value">{{ userStats.robots }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="asset-card green">
              <div class="asset-icon"><Connection /></div>
              <div class="asset-info">
                <span class="asset-label">我的流程</span>
                <span class="asset-value">{{ userStats.flows }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="asset-card orange">
              <div class="asset-icon"><Document /></div>
              <div class="asset-info">
                <span class="asset-label">采集数据量</span>
                <span class="asset-value">{{ userStats.dataTotal }}</span>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 第二层：任务执行统计图表 -->
        <el-card shadow="never" class="chart-section-card">
          <template #header>
            <div class="section-header">
              <span class="title">个人任务执行趋势</span>
              <div class="chart-legend">
                <span class="legend-dot green"></span> 采集
                <span class="legend-dot orange"></span> 处理
                <span class="legend-dot black"></span> 总计
              </div>
            </div>
          </template>
          <div ref="userChartRef" class="user-chart-container"></div>
        </el-card>

        <!-- 第三层：账户设置 (Tabs) -->
        <el-card shadow="never" class="settings-tabs-card">
          <el-tabs v-model="activeTab" class="custom-tabs">
            <el-tab-pane label="更新个人资料" name="basic">
              <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="settings-form">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="姓名" prop="name">
                      <el-input v-model="form.name" placeholder="您的真实姓名" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="联系电话" prop="phone">
                      <el-input v-model="form.phone" placeholder="手机号码" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="电子邮箱" prop="email">
                  <el-input v-model="form.email" placeholder="常用邮箱地址" />
                </el-form-item>
                <div class="form-footer">
                  <el-button type="primary" @click="submitForm(formRef)">保存更改</el-button>
                  <el-button @click="resetForm(formRef)">重置</el-button>
                </div>
              </el-form>
            </el-tab-pane>
            
            <el-tab-pane label="安全隐私 (密码)" name="password">
              <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-position="top" class="settings-form">
                <el-form-item label="当前原密码" prop="oldPassword">
                  <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入当前使用的密码" />
                </el-form-item>
                <el-form-item label="新设密码" prop="newPassword">
                  <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="建议包含字母与数字，不少于6位" />
                </el-form-item>
                <el-form-item label="重复新密码" prop="confirmPassword">
                  <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码以确认" />
                </el-form-item>
                <div class="form-footer">
                  <el-button type="warning" :loading="isSubmittingPassword" :disabled="isSubmittingPassword" @click="submitPasswordForm(passwordFormRef)">确认修改密码</el-button>
                </div>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { 
  User, Camera, Monitor, Connection, Document, 
  UserFilled, Message, Iphone, Timer 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { clearAuth, getUser, updateUser, USER_CHANGED_EVENT } from '../services/auth'
import { updatePassword as updatePasswordApi } from '../api/auth'
import { getTaskExecutions } from '../api/task'

const activeTab = ref('basic')
const formRef = ref(null)
const passwordFormRef = ref(null)
const isSubmittingPassword = ref(false)
const userChartRef = ref(null)
let userChart = null
const executions = ref([])

const defaultAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
const currentUser = ref(getUser())
const avatarDisplaySrc = computed(() => currentUser.value?.avatar || defaultAvatar)
const avatarInputRef = ref(null)

// 日历数据
const calendarValue = ref(new Date())

// 模拟用户数据
const userInfo = reactive({
  username: 'admin',
  name: '系统管理员',
  email: 'admin@example.com',
  phone: '13800138000',
  role: '超级管理员',
  createTime: '2026-01-01'
})

const userStats = reactive({
  robots: 2,
  flows: 5,
  dataTotal: '1,258'
})

const form = reactive({
  name: userInfo.name,
  email: userInfo.email,
  phone: userInfo.phone
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const rules = reactive({
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: ['blur', 'change'] }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
})

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const passwordRules = reactive({
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validatePass2, trigger: 'blur' }
  ]
})

const syncUserInfo = (u) => {
  if (!u) return
  if (u.username) userInfo.username = String(u.username)
  if (u.name) {
    userInfo.name = String(u.name)
    form.name = String(u.name)
  }
  if (u.email) {
    userInfo.email = String(u.email)
    form.email = String(u.email)
  } else {
    userInfo.email = '暂无'
    form.email = ''
  }
  if (u.phone) {
    userInfo.phone = String(u.phone)
    form.phone = String(u.phone)
  } else {
    userInfo.phone = '暂无'
    form.phone = ''
  }
  if (u.role || u.roleName) userInfo.role = String(u.role || u.roleName)
  if (u.createTime || u.createdAt) userInfo.createTime = String(u.createTime || u.createdAt)
}

const openAvatarPicker = () => {
  avatarInputRef.value?.click?.()
}

const onAvatarFileChange = (evt) => {
  const input = evt?.target
  const file = input?.files?.[0]
  if (input) input.value = ''
  if (!file) return

  if (!file.type || !file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }

  const maxSize = 2 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('图片大小不能超过 2MB')
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const url = typeof reader.result === 'string' ? reader.result : ''
    if (!url) {
      ElMessage.error('图片读取失败')
      return
    }
    currentUser.value = updateUser({ avatar: url })
    ElMessage.success('头像已更新')
  }
  reader.onerror = () => {
    ElMessage.error('图片读取失败')
  }
  reader.readAsDataURL(file)
}

const onUserChanged = (e) => {
  currentUser.value = e?.detail ?? getUser()
  syncUserInfo(currentUser.value)
}

const getExecutionTime = (item = {}) => item.startTime || item.endTime || item.createTime || item.updatedAt || ''

const buildRecent7DaysTrendData = () => {
  const rangeDays = 7
  const labels = Array.from({ length: rangeDays }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - ((rangeDays - 1) - index))
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  const now = new Date()
  const stats = Array.from({ length: rangeDays }, () => ({ collect: 0, process: 0, total: 0 }))

  executions.value.forEach((item) => {
    const timeText = getExecutionTime(item)
    const time = timeText ? new Date(timeText) : null
    if (!time || Number.isNaN(time.getTime())) return
    const diffDays = Math.floor((now - time) / (1000 * 60 * 60 * 24))
    if (diffDays < 0 || diffDays > rangeDays - 1) return
    const idx = (rangeDays - 1) - diffDays
    stats[idx].total += 1
    const s = String(item.status || '').toUpperCase()
    if (s === 'SUCCESS' || s === 'COMPLETED') stats[idx].collect += 1
    else stats[idx].process += 1
  })

  return {
    labels,
    collect: stats.map((d) => d.collect),
    process: stats.map((d) => d.process),
    total: stats.map((d) => d.total)
  }
}

const initChart = () => {
  if (userChartRef.value) {
    if (!userChart) userChart = echarts.init(userChartRef.value)
    const chartData = buildRecent7DaysTrendData()

    userChart.setOption({
      tooltip: { 
        trigger: 'axis', 
        axisPointer: { type: 'line', lineStyle: { color: '#e2e8f0', width: 2 } },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#f1f5f9',
        textStyle: { color: '#1e293b' }
      },
      grid: { left: '2%', right: '2%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: chartData.labels, 
        axisLine: { show: false }, 
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: { 
        type: 'value', 
        axisLine: { show: false }, 
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
        axisLabel: { color: '#94a3b8' }
      },
      series: [
        { 
          name: '采集', 
          type: 'line', 
          data: chartData.collect, 
          smooth: true, 
          showSymbol: false,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(187, 247, 208, 0.5)' },
              { offset: 1, color: 'rgba(187, 247, 208, 0.0)' }
            ])
          },
          lineStyle: { color: '#22c55e', width: 3 }
        },
        { 
          name: '处理', 
          type: 'line', 
          data: chartData.process, 
          smooth: true, 
          showSymbol: false,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(254, 215, 170, 0.5)' },
              { offset: 1, color: 'rgba(254, 215, 170, 0.0)' }
            ])
          },
          lineStyle: { color: '#f59e0b', width: 3 }
        },
        { 
          name: '总计', 
          type: 'line', 
          data: chartData.total, 
          smooth: true, 
          showSymbol: true,
          symbolSize: 8,
          itemStyle: { color: '#334155', borderWidth: 2, borderColor: '#fff' },
          lineStyle: { color: '#334155', width: 2, type: 'dashed' }
        }
      ]
    })
  }
}

const submitForm = async (formEl) => {
  if (!formEl) return
  await formEl.validate((valid) => {
    if (valid) {
      Object.assign(userInfo, form)
      ElMessage.success('资料已更新')
    }
  })
}

const submitPasswordForm = async (formEl) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (!valid || isSubmittingPassword.value) return
    isSubmittingPassword.value = true
    try {
      await updatePasswordApi({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      })
      ElMessage.success('密码修改成功')
      formEl.resetFields()
      clearAuth()
      window.location.hash = '#/login'
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.msg ||
        error?.message ||
        '密码修改失败'
      ElMessage.error(message)
    } finally {
      isSubmittingPassword.value = false
    }
  })
}

const resetForm = (formEl) => formEl?.resetFields()

const fetchExecutionData = async () => {
  try {
    const res = await getTaskExecutions({ page: 1, size: 1000 })
    const list = Array.isArray(res?.list) ? res.list : []
    executions.value = list
  } catch (error) {
    console.error('加载个人任务趋势数据失败:', error)
    executions.value = []
  }
}

const handleResize = () => userChart?.resize()

onMounted(async () => {
  syncUserInfo(currentUser.value)
  await fetchExecutionData()
  initChart()
  window.addEventListener('resize', handleResize)
  window.addEventListener(USER_CHANGED_EVENT, onUserChanged)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener(USER_CHANGED_EVENT, onUserChanged)
})
</script>

<style scoped>
.user-profile-container {
  padding: 32px;
  background-color: #f8fafc;
  min-height: calc(100vh - 60px);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* 左侧身份卡片 */
.profile-main-card {
  border: none;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

.profile-header-bg {
  height: 100px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
}

.profile-content {
  padding: 0 24px 24px;
  margin-top: -50px;
  text-align: center;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 12px;
}

.user-avatar {
  border: 4px solid #fff;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  cursor: pointer;
}

.avatar-edit-overlay {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 28px;
  height: 28px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  border: 2px solid #fff;
}

.user-name {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px;
}

.user-role-text {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px;
}

.info-details {
  text-align: left;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .el-icon {
  color: #94a3b8;
  font-size: 16px;
}

.detail-item .label {
  color: #64748b;
  width: 60px;
}

.detail-item .value {
  color: #1e293b;
  font-weight: 500;
  flex: 1;
}

.w-full {
  width: 100%;
}

/* 日历卡片 */
.main-profile-row {
  display: flex;
  align-items: stretch; /* 确保子项拉伸对齐 */
  flex: 1;
  min-height: 0;
}

.left-sticky-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 0;
}

.left-blank-tools {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.calendar-card {
  margin-top: 0;
  border: none;
  border-radius: 16px;
  overflow: hidden;
  flex: 1; /* 使日历填充剩余空间，实现底线对齐 */
  display: flex;
  flex-direction: column;
}

.mini-calendar {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.mini-calendar :deep(.el-calendar__body) {
  padding-bottom: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.mini-calendar :deep(.el-calendar-table) {
  flex: 1;
}

.mini-calendar :deep(.el-calendar-table .el-calendar-day) {
  height: auto;
  min-height: 40px;
  flex: 1;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-calendar :deep(.el-calendar__header) {
  padding: 12px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.mini-calendar :deep(.el-calendar__title) {
  font-size: 14px;
  font-weight: 600;
}

.mini-calendar :deep(.el-calendar-table th) {
  font-size: 12px;
  color: #94a3b8;
  padding: 8px 0;
}

/* 右侧资产卡片 */
.asset-row {
  margin-bottom: 0;
}

.asset-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

.asset-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  margin-right: 16px;
}

.asset-card.blue .asset-icon { background: #eff6ff; color: #3b82f6; }
.asset-card.green .asset-icon { background: #f0fdf4; color: #10b981; }
.asset-card.orange .asset-icon { background: #fff7ed; color: #f59e0b; }

.asset-info {
  display: flex;
  flex-direction: column;
}

.asset-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px;
}

.asset-value {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
}

/* 图表部分 */
.chart-section-card {
  border: none;
  border-radius: 16px;
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.section-header .title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.chart-legend {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.legend-dot.green { background: #bbf7d0; }
.legend-dot.orange { background: #fed7aa; }
.legend-dot.black { background: #334155; }

.user-chart-container {
  height: 300px;
  width: 100%;
}

/* 设置 Tabs 部分 */
.right-content-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 0;
}

.settings-tabs-card {
  border: none;
  border-radius: 16px;
  flex: 1; /* 使设置卡片填充剩余高度 */
  display: flex;
  flex-direction: column;
}

.settings-tabs-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.custom-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.custom-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 24px;
  border-bottom: 1px solid #f1f5f9;
}

.custom-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.custom-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  padding: 0 24px;
  height: 50px;
  line-height: 50px;
  font-weight: 500;
}

.custom-tabs :deep(.el-tabs__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.custom-tabs :deep(.el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.settings-form {
  padding: 24px 32px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px; /* 增加表单项之间的间隔 */
}

.settings-form :deep(.el-form-item) {
  margin-bottom: 0; /* 使用 gap 控制间隔 */
}

.form-footer {
  margin-top: auto; /* 将按钮推至底部 */
  padding-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
