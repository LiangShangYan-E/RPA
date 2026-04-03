<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1 class="login-title">RPA运营管理系统</h1>
        <p class="login-subtitle">重庆工程学院</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" class="login-form" @keyup.enter="onSubmit">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="form.rememberMe">记住我</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button class="login-button" type="primary" size="large" :loading="loading" @click="onSubmit">
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p class="tips">默认账号：admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { login } from '../api/auth'
import { setToken, setUser } from '../services/auth'

const router = useRouter()
const route = useRoute()

const formRef = ref()
const loading = ref(false)

const LOGIN_CACHE_KEY = 'rpa_login_cache'

const loadLoginCache = () => {
  const raw = localStorage.getItem(LOGIN_CACHE_KEY)
  if (!raw) return { username: '', password: '', rememberMe: false }
  try {
    const v = JSON.parse(raw)
    return {
      username: v?.username ? String(v.username) : '',
      password: v?.password ? String(v.password) : '',
      rememberMe: Boolean(v?.rememberMe)
    }
  } catch {
    return { username: '', password: '', rememberMe: false }
  }
}

const saveLoginCache = ({ username, password, rememberMe }) => {
  localStorage.setItem(
    LOGIN_CACHE_KEY,
    JSON.stringify({
      username: username ? String(username) : '',
      password: rememberMe ? String(password || '') : '',
      rememberMe: Boolean(rememberMe)
    })
  )
}

const cached = loadLoginCache()
const form = reactive({
  username: cached.username,
  password: cached.password,
  rememberMe: cached.rememberMe
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

async function onSubmit() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return

  loading.value = true
  try {
    const { token, userInfo } = await login({ username: form.username, password: form.password })
    setToken(token, form.rememberMe)
    setUser(userInfo, form.rememberMe)
    saveLoginCache({
      username: form.username,
      password: form.password,
      rememberMe: form.rememberMe
    })
    ElMessage.success('登录成功')

    const redirect = route.query.redirect ? String(route.query.redirect) : '/dashboard'
    await router.replace(redirect)
  } catch (e) {
    const status = e?.response?.status
    const serverMsg = e?.response?.data?.message || e?.response?.data?.msg
    if (status === 401) {
      ElMessage.error(serverMsg || '用户名或密码错误')
    } else if (status === 404) {
      ElMessage.error(serverMsg || '登录接口不存在')
    } else {
      ElMessage.error(serverMsg || e?.message || '登录失败，请检查用户名和密码')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  box-sizing: border-box;
  background: radial-gradient(1200px 800px at 20% 20%, rgba(120, 150, 255, 0.75), rgba(120, 95, 200, 0.85)),
    linear-gradient(135deg, #5f86ff, #7b5bd2);
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 60px 60px;
  transform: scale(1.05);
  opacity: 0.9;
  pointer-events: none;
}

.login-box {
  width: 520px;
  max-width: calc(100vw - 48px);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 10px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.18);
  padding: 54px 70px 36px;
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-title {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 1px;
  margin: 0 0 10px;
  color: #3b3b3b;
}

.login-subtitle {
  margin: 0;
  font-size: 14px;
  color: #7a7a7a;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  padding: 0 14px;
}

.login-form :deep(.el-input__inner) {
  height: 44px;
  font-size: 14px;
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 4px;
}

.login-footer {
  margin-top: 10px;
  text-align: center;
}

.tips {
  margin: 0;
  color: rgba(0, 0, 0, 0.35);
  font-size: 13px;
}
</style>

