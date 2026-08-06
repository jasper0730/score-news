import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
    baseDirectory: __dirname,
})

const eslintConfig = [
    // 沒有這段的話，`eslint .` 會連 .next 的產生檔一起掃，
    // 跑出上萬個與原始碼無關的錯誤，讓真正的問題被淹沒
    {
        ignores: [
            '.next/**',
            'node_modules/**',
            // 測試覆蓋率報告是產生出來的靜態檔，同樣不該進 lint
            'coverage/**',
            'next-env.d.ts',
            '*.tsbuildinfo',
        ],
    },
    ...compat.extends('next/core-web-vitals', 'next/typescript'),
    {
        rules: {
            // 巢狀三元沒有縮排可循，要靠肉眼配對 ? 和 : 才知道哪個條件對應哪個
            // 結果，改的時候很容易接錯分支。單層三元不受影響。
            // 改寫方式見 CLAUDE.md 的「程式碼風格與命名規範」。
            'no-nested-ternary': 'error',
        },
    },
]

export default eslintConfig
