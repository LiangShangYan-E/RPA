import { createRouter, createWebHashHistory } from 'vue-router'
import { isAuthenticated, clearAuth, getUser } from '../services/auth'

const Login = () => import('../views/Login.vue')
const MainLayout = () => import('../layout/MainLayout.vue')
const RPALayout = () => import('../layout/RPALayout.vue')
const Dashboard = () => import('../views/Dashboard.vue')
const TaskManagement = () => import('../views/TaskManagement.vue')
const ClientManagement = () => import('../views/ClientManagement.vue')
const UserProfile = () => import('../views/UserProfile.vue')
const SystemUserManagement = () => import('../views/SystemUserManagement.vue')
const SystemRoleManagement = () => import('../views/SystemRoleManagement.vue')
const SystemResourceManagement = () => import('../views/SystemResourceManagement.vue')
const ExecutionRecord = () => import('../views/ExecutionRecord.vue')
const FlowList = () => import('../views/FlowList.vue')
const FlowDesign = () => import('../views/FlowDesign.vue')
const DataCollectIndex = () => import('../views/DataCollect/Index.vue')
const DataParse = () => import('../views/DataParse.vue')
const DataProcess = () => import('../views/DataProcess.vue')
const DataQuery = () => import('../views/DataQuery.vue')
const EmptyPage = () => import('../views/EmptyPage.vue')

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login },
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: 'dashboard', component: Dashboard },
        {
          path: 'system',
          component: RPALayout,
          redirect: '/system/profile',
          children: [
            { path: 'profile', component: UserProfile },
            { path: 'user', component: SystemUserManagement },
            { path: 'role', component: SystemRoleManagement },
            { path: 'resource', component: SystemResourceManagement }
          ]
        },
        {
          path: 'rpa',
          component: RPALayout,
          redirect: '/rpa/task',
          children: [
            { path: 'task', component: TaskManagement },
            { path: 'task/record', component: ExecutionRecord },
            { path: 'robot', component: ClientManagement },
            { path: 'process', component: FlowList },
            { path: 'process/design/:id', component: FlowDesign },
            { path: 'data', component: DataCollectIndex },
            { path: 'data/collect', component: DataCollectIndex },
            { path: 'data/parse', component: DataParse },
            { path: 'data/process', component: DataProcess },
            { path: 'data/query', component: DataQuery }
          ]
        },
        // Legacy redirects
        { path: 'task', redirect: '/rpa/task' },
        { path: 'task/list', redirect: '/rpa/task' },
        { path: 'task/record', redirect: '/rpa/task/record' },
        { path: 'client', redirect: '/rpa/robot' },
        { path: 'flow', redirect: '/rpa/process' },
        { path: 'flow/list', redirect: '/rpa/process' },
        { path: 'flow/design/:id', redirect: to => `/rpa/process/design/${to.params.id}` },
        { path: 'data', redirect: '/rpa/data' },
        { path: 'data/collect', redirect: '/rpa/data' },
        { path: 'data/parse', redirect: '/rpa/data/parse' },
        { path: 'data/process', redirect: '/rpa/data/process' },
        { path: 'data/query', redirect: '/rpa/data/query' },
        { path: 'user', redirect: '/system/profile' },
        { path: 'user/profile', redirect: '/system/profile' },
        { path: 'log', component: EmptyPage },
        { path: 'settings', component: EmptyPage }
      ]
    }
  ]
})

router.beforeEach((to) => {
  if (to.path === '/login') {
    clearAuth()
    return true
  }
  if (!isAuthenticated()) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // Permission guard for system management pages (except profile)
  if (to.path.startsWith('/system') && to.path !== '/system/profile') {
    const currentUser = getUser()
    const role = currentUser?.role || currentUser?.roleName || ''
    const isAdvancedOperator = role.includes('高级操作员') || role.includes('系统管理员') || role.includes('管理员') || currentUser?.username === 'admin'

    if (!isAdvancedOperator) {
      return { path: '/system/profile' }
    }
  }

  return true
})

export default router
