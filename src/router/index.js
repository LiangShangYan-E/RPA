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
const DataCollect = () => import('../views/DataCollect.vue')
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
          path: 'task',
          component: RPALayout,
          redirect: '/task/list',
          children: [
            { path: 'list', component: TaskManagement },
            { path: 'record', component: ExecutionRecord }
          ]
        },
        {
          path: 'client',
          component: RPALayout,
          children: [
            { path: '', component: ClientManagement }
          ]
        },
        {
          path: 'flow',
          component: RPALayout,
          redirect: '/flow/list',
          children: [
            { path: 'list', component: FlowList },
            { path: 'design/:id', component: FlowDesign }
          ]
        },
        {
          path: 'data',
          component: RPALayout,
          children: [
            { path: 'collect', component: DataCollect },
            { path: 'parse', component: DataParse },
            { path: 'process', component: DataProcess },
            { path: 'query', component: DataQuery }
          ]
        },
        {
          path: 'system',
          component: RPALayout,
          redirect: '/system/user',
          children: [
            { path: 'user', component: SystemUserManagement },
            { path: 'role', component: SystemRoleManagement },
            { path: 'resource', component: SystemResourceManagement }
          ]
        },
        {
          path: 'user',
          component: RPALayout,
          redirect: '/user/profile',
          children: [
            { path: 'profile', component: UserProfile }
          ]
        },
        { path: 'log', component: EmptyPage },
        { path: 'settings', component: EmptyPage }
      ]
    }
  ]
})

router.beforeEach((to) => {
  if (to.path === '/login') {
    // Force clear auth when explicitly going to login page (or redirected from root)
    // This ensures the first page from root is ALWAYS the login page.
    clearAuth()
    return true
  }
  if (!isAuthenticated()) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // Permission guard for system management pages
  if (to.path.startsWith('/system')) {
    const currentUser = getUser()
    const role = currentUser?.role || currentUser?.roleName || ''
    const isAdvancedOperator = role.includes('高级操作员') || role.includes('系统管理员') || role.includes('管理员') || currentUser?.username === 'admin'
    
    if (!isAdvancedOperator) {
      return { path: '/user/profile' }
    }
  }

  return true
})

export default router
