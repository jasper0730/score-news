import { describe, expect, it, vi } from 'vitest'
import { makeUser } from '@/test/helpers/fixtures'

const getUser = vi.hoisted(() => vi.fn())
vi.mock('@/actions/getUser', () => ({ getUser }))

const { requireAuth } = await import('@/libs/auth')

describe('requireAuth', () => {
    it('有使用者時回傳 authenticated:true 與使用者本身', async () => {
        const user = makeUser()
        getUser.mockResolvedValue(user)

        const result = await requireAuth()

        expect(result).toEqual({ authenticated: true, user })
    })

    it('沒有使用者時回傳 authenticated:false 與錯誤訊息', async () => {
        getUser.mockResolvedValue(null)

        expect(await requireAuth()).toEqual({
            authenticated: false,
            error: 'User not authenticated',
        })
    })

    it('回傳型別是可辨識聯集，收窄後才拿得到 user', async () => {
        getUser.mockResolvedValue(makeUser())

        const result = await requireAuth()

        // 這段的價值在編譯期：沒有先檢查 authenticated 就存取 result.user 會編譯失敗
        if (!result.authenticated) {
            expect.unreachable('應該是已登入')
        }
        expect(result.user.id).toBeDefined()
    })
})
