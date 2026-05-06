<template>
  <el-container class="rpa-layout">
    <el-aside width="200px" class="rpa-aside">
      <el-menu
        :default-active="activeMenu"
        class="side-menu"
        router
      >
        <template v-for="menu in currentSectionMenus" :key="menu.id">
          <el-sub-menu v-if="menu.children && menu.children.filter(c => !c.isHidden).length" :index="menu.path">
            <template #title>
              <el-icon v-if="menu.icon && Icons[menu.icon]"><component :is="Icons[menu.icon]" /></el-icon>
              <span>{{ menu.name }}</span>
            </template>
            <el-menu-item
              v-for="child in menu.children.filter(c => !c.isHidden)"
              :key="child.id"
              :index="child.path"
            >
              {{ child.name }}
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="menu.path">
            <el-icon v-if="menu.icon && Icons[menu.icon]"><component :is="Icons[menu.icon]" /></el-icon>
            <span>{{ menu.name }}</span>
          </el-menu-item>
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
import * as Icons from '@element-plus/icons-vue'
import { useMenus } from '../services/menu'

const route = useRoute()
const menus = useMenus()

const SUB_MENU_MAP = {
  '/rpa/task': [
    { id: 'task-list', name: '任务列表', path: '/rpa/task' },
    { id: 'task-record', name: '执行记录', path: '/rpa/task/record' }
  ],
  '/rpa/robot': [
    { id: 'robot-list', name: '机器人列表', path: '/rpa/robot' }
  ],
  '/rpa/process': [
    { id: 'process-list', name: '流程列表', path: '/rpa/process' }
  ],
  '/rpa/data': [
    { id: 'data-query', name: '数据查询', path: '/rpa/data/query' }
  ]
}

const pathMatchesNode = (path, node) => {
  if (path.startsWith(node.path) || path === node.path) return true
  if (node.children) return node.children.some(c => pathMatchesNode(path, c))
  return false
}

const enrichWithSubMenus = (items) => {
  return items.map(item => {
    const subKey = Object.keys(SUB_MENU_MAP).find(k => item.path === k || item.path.startsWith(k + '/'))
    if ((!item.children || item.children.length === 0) && subKey) {
      return { ...item, children: SUB_MENU_MAP[subKey] }
    }
    return item
  })
}

const currentSectionMenus = computed(() => {
  const path = route.path
  for (const menu of menus.value) {
    if (pathMatchesNode(path, menu)) {
      const items = (menu.children || [])
        .filter(c => !c.isHidden)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      return enrichWithSubMenus(items)
    }
  }
  return []
})

const activeMenu = computed(() => {
  const path = route.path
  const allPaths = []
  for (const menu of currentSectionMenus.value) {
    if (menu.children?.length) {
      for (const child of menu.children) allPaths.push(child.path)
    } else {
      allPaths.push(menu.path)
    }
  }
  if (allPaths.includes(path)) return path
  let best = ''
  for (const p of allPaths) {
    if (path.startsWith(p) && p.length > best.length) best = p
  }
  return best || path
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
