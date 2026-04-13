import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || ''

  return {
    plugins: [vue()],
    server: {
      port: 5173,
      proxy: proxyTarget
        ? {
            '/auth': { target: proxyTarget, changeOrigin: true },
            '/task': { target: proxyTarget, changeOrigin: true },
            '/process': { target: proxyTarget, changeOrigin: true },
            '/api': { target: proxyTarget, changeOrigin: true },
            '/deepseek': { target: 'https://api.deepseek.com', changeOrigin: true, rewrite: (path) => path.replace(/^\/deepseek/, '') }
          }
        : undefined
    }
  }
})
