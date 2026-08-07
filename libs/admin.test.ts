import { afterEach, describe, expect, it, vi } from 'vitest'
import { isAdminEmail } from '@/libs/admin'

afterEach(() => {
    vi.unstubAllEnvs()
})

describe('isAdminEmail', () => {
    it('清單內的 Email 是管理員', () => {
        vi.stubEnv('ADMIN_EMAILS', 'boss@example.com')

        expect(isAdminEmail('boss@example.com')).toBe(true)
    })

    it('不在清單內的不是', () => {
        vi.stubEnv('ADMIN_EMAILS', 'boss@example.com')

        expect(isAdminEmail('someone@example.com')).toBe(false)
    })

    it('支援逗號分隔的多位管理員', () => {
        vi.stubEnv('ADMIN_EMAILS', 'a@example.com,b@example.com')

        expect(isAdminEmail('a@example.com')).toBe(true)
        expect(isAdminEmail('b@example.com')).toBe(true)
    })

    it('容忍逗號前後的空白', () => {
        vi.stubEnv('ADMIN_EMAILS', ' a@example.com , b@example.com ')

        expect(isAdminEmail('b@example.com')).toBe(true)
    })

    it('比對不分大小寫——Email 的網域部分本來就不分大小寫', () => {
        vi.stubEnv('ADMIN_EMAILS', 'Boss@Example.COM')

        expect(isAdminEmail('boss@example.com')).toBe(true)
    })

    describe('沒有人是管理員的情況', () => {
        it.each([
            ['環境變數未設定', undefined],
            ['環境變數是空字串', ''],
            ['只有逗號與空白', ' , , '],
        ])('%s', (_label, value) => {
            vi.stubEnv('ADMIN_EMAILS', value)

            expect(isAdminEmail('anyone@example.com')).toBe(false)
        })

        it('空字串不會意外對上空的清單項目', () => {
            // 過濾掉空項目，否則 ''.split(',') 產生的空字串會讓沒有 Email 的人變管理員
            vi.stubEnv('ADMIN_EMAILS', 'a@example.com,,b@example.com')

            expect(isAdminEmail('')).toBe(false)
        })
    })

    it.each([[null], [undefined], ['']])('沒有 Email（%s）時一律不是管理員', (email) => {
        vi.stubEnv('ADMIN_EMAILS', 'boss@example.com')

        expect(isAdminEmail(email)).toBe(false)
    })
})
