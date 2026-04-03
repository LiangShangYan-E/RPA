<template>
  <el-result icon="info" title="功能开发中" sub-title="该功能模块正在一比一复刻中，敬请期待">
    <template #extra>
      <el-button type="primary" @click="router.push('/dashboard')">回到控制台</el-button>
    </template>
  </el-result>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>
