import { describe, expect, it, vi } from 'vitest'
import { collection } from '@/test/helpers/db'
import { makeUserDoc, USER_ID } from '@/test/helpers/fixtures'

vi.mock('@/libs/db', async () => ({
    getCollection: (await import('@/test/helpers/db')).getCollection,
}))

// getSession / getUser 外面包了 react 的 cache()，那是 React 的 request 去重機制，
// 不是我們的邏輯。這裡換成 identity 讓每次呼叫都真的執行，測試才彼此獨立。
vi.mock('react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('react')>()),
    cache: <T>(fn: T) => fn,
}))

const getServerSession = vi.hoisted(() => vi.fn())
vi.mock('next-auth', () => ({ getServerSession }))
vi.mock('@/app/api/auth/[...nextauth]/options', () => ({ options: {} }))

const { getUser, getSession } = await import('@/actions/getUser')

describe('getSession', () => {
    it('回傳 next-auth 的 session', async () => {
        const session = { user: { email: 'ming@example.com' } }
        getServerSession.mockResolvedValue(session)

        expect(await getSession()).toBe(session)
    })
})

describe('getUser', () => {
    it('沒有 session 時回 null，且不查資料庫', async () => {
        getServerSession.mockResolvedValue(null)

        expect(await getUser()).toBeNull()
        expect(collection('users').findOne).not.toHaveBeenCalled()
    })

    it('session 沒有 email 時回 null', async () => {
        getServerSession.mockResolvedValue({ user: {} })

        expect(await getUser()).toBeNull()
        expect(collection('users').findOne).not.toHaveBeenCalled()
    })

    it('依 session 的 email 查使用者', async () => {
        getServerSession.mockResolvedValue({ user: { email: 'ming@example.com' } })
        collection('users').findOne.mockResolvedValue(makeUserDoc())

        await getUser()

        expect(collection('users').findOne).toHaveBeenCalledWith({ email: 'ming@example.com' })
    })

    it('資料庫查無此人時回 null', async () => {
        getServerSession.mockResolvedValue({ user: { email: 'ghost@example.com' } })
        collection('users').findOne.mockResolvedValue(null)

        expect(await getUser()).toBeNull()
    })

    it('絕不回傳密碼雜湊', async () => {
        // 這個結果會成為 client component 的 prop，
        // 展開整份 document 等於把密碼雜湊序列化進 RSC payload 送到瀏覽器
        getServerSession.mockResolvedValue({ user: { email: 'ming@example.com' } })
        collection('users').findOne.mockResolvedValue(makeUserDoc())

        const user = await getUser()

        expect(user).not.toHaveProperty('password')
        expect(JSON.stringify(user)).not.toContain('$2a$12$hashed')
    })

    it('只輸出白名單欄位，資料庫多長出來的欄位不會外流', async () => {
        getServerSession.mockResolvedValue({ user: { email: 'ming@example.com' } })
        collection('users').findOne.mockResolvedValue({
            ...makeUserDoc(),
            resetToken: 'super-secret',
            isAdmin: true,
        })

        const user = await getUser()

        expect(Object.keys(user ?? {}).sort()).toEqual([
            'bio',
            'email',
            'id',
            'image',
            'name',
            'nickname',
        ])
    })

    it('_id 轉成字串 id', async () => {
        getServerSession.mockResolvedValue({ user: { email: 'ming@example.com' } })
        collection('users').findOne.mockResolvedValue(makeUserDoc())

        expect((await getUser())?.id).toBe(USER_ID)
    })

    it('查詢丟出例外時回 null 而不是讓整頁掛掉', async () => {
        getServerSession.mockResolvedValue({ user: { email: 'ming@example.com' } })
        collection('users').findOne.mockRejectedValue(new Error('boom'))

        expect(await getUser()).toBeNull()
    })
})
