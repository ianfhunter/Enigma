import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    cacheDir: process.env.VITE_CACHE_DIR || 'node_modules/.vite',
    optimizeDeps: {
        include: ['killer-sudoku-generator']
    },
    resolve: {
        alias: {
            '@datasets': path.resolve(__dirname, 'datasets'),
        }
    },
    server: {
        host: '0.0.0.0', // Listen on all network interfaces
        allowedHosts: true, // Allow all hosts
        proxy: {
            // Proxy API requests to backend during development
            // Use API_PROXY_TARGET for server-side proxy (not VITE_ prefix, so not exposed to browser)
            '/api': {
                target: process.env.API_PROXY_TARGET || 'http://localhost:3000',
                changeOrigin: true,
                secure: false
            }
        }
    },
    test: {
        environment: 'node',
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            reportsDirectory: './coverage',
            include: ['src/**/*.{js,jsx}'],
            exclude: ['**/*.test.js', '**/node_modules/**']
        }
    }
  })
