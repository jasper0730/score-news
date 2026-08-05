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
]

export default eslintConfig
