<template>
  <el-container class="rpa-layout">
    <el-aside width="200px" class="rpa-aside">
      <el-menu
        :default-active="activeMenu"
        class="side-menu"
        router
      >
        <!-- RPA运营管理菜单 -->
        <template v-if="currentSection === 'rpa'">
          <el-sub-menu index="task">
            <template #title><span>任务管理</span></template>
            <el-menu-item index="/task/list">任务列表</el-menu-item>
            <el-menu-item index="/task/record">执行记录</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="robot">
            <template #title><span>机器人管理</span></template>
            <el-menu-item index="/client">机器人列表</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="flow">
            <template #title><span>流程管理</span></template>
            <el-menu-item index="/flow/list">流程列表</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="data">
            <template #title><span>数据管理</span></template>
            <el-menu-item index="/data/collect">数据采集</el-menu-item>
            <el-menu-item index="/data/parse">数据解析</el-menu-item>
            <el-menu-item index="/data/process">数据加工</el-menu-item>
            <el-menu-item index="/data/query">数据查询</el-menu-item>
          </el-sub-menu>
        </template>

        <!-- 系统管理菜单 -->
        <template v-else-if="currentSection === 'system'">
          <el-sub-menu index="system-manage">
            <template #title><span>系统管理</span></template>
            <el-menu-item index="/user/profile">个人信息</el-menu-item>
            <template v-if="isAdvancedOperator">
              <el-menu-item index="/system/user">用户管理</el-menu-item>
              <el-menu-item index="/system/role">角色管理</el-menu-item>
              <el-menu-item index="/system/resource">资源管理</el-menu-item>
            </template>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>
    <el-main class="rpa-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getUser } from '../services/auth'

const route = useRoute()
const activeMenu = computed(() => route.path)
const currentUser = getUser()
// 只要包含"高级操作员"或"系统管理员"字样，就认为有高级权限
const isAdvancedOperator = computed(() => {
  const role = currentUser?.role || currentUser?.roleName || ''
  return role.includes('高级操作员') || role.includes('系统管理员') || role.includes('管理员') || currentUser?.username === 'admin'
})

const currentSection = computed(() => {
  const path = route.path
  if (path.startsWith('/task') || path.startsWith('/client') || path.startsWith('/flow') || path.startsWith('/data')) {
    return 'rpa'
  }
  if (path.startsWith('/system') || path.startsWith('/user') || path.startsWith('/settings')) {
    return 'system'
  }
  return ''
})
</script>

<style scoped>
.rpa-layout {
  height: 100%;
}

.rpa-aside {
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
}

.side-menu {
  border-right: none;
}

.side-menu :deep(.el-sub-menu__title) {
  font-weight: bold;
  color: #333;
}

.side-menu :deep(.el-menu-item) {
  height: 40px;
  line-height: 40px;
  margin: 4px 0;
}

.side-menu :deep(.el-menu-item.is-active) {
  background-color: #ecf5ff;
  color: #409eff;
  border-right: 3px solid #409eff;
}

.rpa-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
