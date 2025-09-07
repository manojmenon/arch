import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: parseInt(env.VITE_DEV_SERVER_PORT) || 3000,
      host: env.VITE_DEV_SERVER_HOST || 'localhost',
      https: env.VITE_DEV_SERVER_HTTPS === 'true',
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: env.VITE_BUILD_SOURCEMAP === 'true',
      minify: env.VITE_BUILD_MINIFY === 'true',
    },
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __APP_NAME__: JSON.stringify(env.VITE_APP_NAME || 'Project Management System'),
      __APP_ENVIRONMENT__: JSON.stringify(env.VITE_APP_ENVIRONMENT || 'development'),
    },
  }
})

