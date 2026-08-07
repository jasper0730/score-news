import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

/**
 * 分成兩個 project：
 * - server：server actions / API route / libs，跑在 node 環境，沒有 DOM
 * - client：components 與 hooks，跑在 jsdom
 *
 * 混在同一個環境會出問題：jsdom 下 mongodb 之類的 node 模組行為不一致，
 * 而 node 環境又沒有 document 可以給 Testing Library 用。
 */
export default defineConfig({
    resolve: {
        alias: {
            '@': rootDir,
        },
    },
    test: {
        globals: false,
        // 每個測試檔互相獨立，避免 module registry 與 mock 狀態互相污染
        restoreMocks: true,
        clearMocks: true,
        unstubEnvs: true,
        projects: [
            {
                extends: true,
                plugins: [react()],
                test: {
                    name: 'client',
                    environment: 'jsdom',
                    setupFiles: ['./test/setup.client.ts'],
                    include: [
                        'components/**/*.test.{ts,tsx}',
                        'hooks/**/*.test.{ts,tsx}',
                        'store/**/*.test.{ts,tsx}',
                        'utils/**/*.test.{ts,tsx}',
                        'libs/cn.test.ts',
                        // 用到 navigator，需要 jsdom
                        'libs/share.test.ts',
                        // app/ 底下的元件測試。副檔名刻意與 server project 的
                        // 'app/**/*.test.ts' 區隔，同一個目錄才能兩種環境並存
                        'app/**/*.test.tsx',
                    ],
                },
            },
            {
                extends: true,
                test: {
                    name: 'server',
                    environment: 'node',
                    setupFiles: ['./test/setup.server.ts'],
                    include: [
                        'actions/**/*.test.ts',
                        'app/**/*.test.ts',
                        'libs/auth.test.ts',
                        'libs/mongodb.test.ts',
                        'libs/db.test.ts',
                        'libs/rss/**/*.test.ts',
                    ],
                },
            },
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['actions/**', 'libs/**', 'hooks/**', 'store/**', 'utils/**', 'components/**'],
            exclude: ['**/*.test.{ts,tsx}', 'libs/datas/**'],
            // 目前約 98%，門檻設在稍低的位置：不是為了逼近 100%，
            // 而是讓「新增邏輯卻沒補測試」在 CI 就被擋下來
            thresholds: {
                statements: 90,
                branches: 85,
                functions: 90,
                lines: 90,
            },
        },
    },
})
