import { afterEach, beforeEach, vi } from 'vitest'
import { resetCollections } from './helpers/db'

beforeEach(() => {
    resetCollections()
    // 這些 action 都會在 catch 裡 console.error，測試預期錯誤路徑時
    // 不需要把噪音印出來，但保留 spy 讓測試可以斷言有記錄下來
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
    vi.restoreAllMocks()
})
