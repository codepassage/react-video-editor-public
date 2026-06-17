import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const frontendPort = parseInt(env.VITE_PORT || '3010')
  const backendPort = parseInt(env.VITE_BACKEND_PORT || '5002')

  // 백엔드 호스트 동적 결정
  const backendHost = env.VITE_BACKEND_HOST
  const backendUrl = `http://${backendHost}:${backendPort}`

  console.log('🔧 Vite Proxy Configuration:', {
    frontend: `http://0.0.0.0:${frontendPort}`,
    backend: backendUrl,
    proxyTarget: backendUrl
  })

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      // Stagewise 툴바 개발 모드에서 사전 번들링 제외
      exclude: ['@stagewise/toolbar'],
    },
    css: {
      postcss: './postcss.config.js',
    },
    server: {
      port: frontendPort,
      host: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/font': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
