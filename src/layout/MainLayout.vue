<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="header-left">
        <div class="logo">
          <span>社会边角料</span>
        </div>
        <el-menu
          mode="horizontal"
          :default-active="activeMenu"
          class="nav-menu"
          :ellipsis="false"
          router
        >
          <el-menu-item index="/dashboard">首页</el-menu-item>
          <el-menu-item index="/task">RPA运营管理</el-menu-item>
          <el-menu-item index="/system">系统管理</el-menu-item>
        </el-menu>
      </div>
      <div class="header-right">
        <el-dropdown trigger="click">
          <div class="user-info">
            <el-avatar :size="32" :src="user?.avatar" />
            <span class="username">{{ user?.name || '系统管理员' }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="router.push('/user')">个人中心</el-dropdown-item>
              <el-dropdown-item @click="router.push('/settings')">设置</el-dropdown-item>
              <el-dropdown-item divided @click="onLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-main class="main">
      <router-view v-slot="{ Component }">
        <transition name="fade-transform" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { getUser, clearAuth, USER_CHANGED_EVENT } from '../services/auth'

const route = useRoute()
const router = useRouter()
const user = ref(getUser())

const activeMenu = computed(() => route.path)

const onUserChanged = (e) => {
  user.value = e?.detail ?? getUser()
}

const onLogout = async () => {
  try {
    await ElMessageBox.confirm('确认退出系统吗？', '提示', {
      type: 'warning'
    })
    clearAuth()
    user.value = null
    router.replace('/login')
  } catch {}
}

onMounted(() => {
  window.addEventListener(USER_CHANGED_EVENT, onUserChanged)
})

onUnmounted(() => {
  window.removeEventListener(USER_CHANGED_EVENT, onUserChanged)
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #1e3a8a; /* Deep blue to match image */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  height: 60px;
  color: white;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 12px rgba(15, 23, 42, 0.15);
}

.header-left {
  display: flex;
  align-items: center;
  height: 100%;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  white-space: nowrap;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.06);
  border-right: 1px solid rgba(255, 255, 255, 0.12);
}

.nav-menu {
  background-color: transparent;
  border-bottom: none;
  height: 100%;
}

.nav-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.8);
  border-bottom: none !important;
  height: 60px;
  line-height: 60px;
  padding: 0 20px;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
}

.nav-menu :deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.nav-menu :deep(.el-menu-item.is-active) {
  background-color: #2563eb !important;
  color: white !important;
}

.header-right {
  display: flex;
  align-items: center;
  padding-right: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  height: 40px;
  border-radius: 999px;
  cursor: pointer;
  user-select: none;
  color: rgba(255, 255, 255, 0.92);
  background-color: rgba(255, 255, 255, 0.06);
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: rgba(255, 255, 255, 0.12);
}

.username {
  font-size: 14px;
}

.main {
  background-color: #f0f2f5;
  padding: 0;
  flex: 1;
  overflow-y: auto; /* 允许纵向滚动 */
}

/* transition */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
