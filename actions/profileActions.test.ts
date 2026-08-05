import { ObjectId } from 'mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { collection } from '@/test/helpers/db'
import { makeUser, makeUserDoc, USER_ID } from '@/test/helpers/fixtures'

vi.mock('@/libs/db', async () => ({
    getCollection: (await import('@/test/helpers/db')).getCollection,
}))

const requireAuth = vi.hoisted(() => vi.fn())
vi.mock('@/libs/auth', () => ({ requireAuth }))

const { getProfileAction, updateProfileAction } = await import('@/actions/profileActions')

beforeEach(() => {
    requireAuth.mockResolvedValue({ authenticated: true, user: makeUser() })
})

describe('getProfileAction', () => {
    it('未登入時拒絕', async () => {
        requireAuth.mockResolvedValue({ authenticated: false, error: 'User not authenticated' })

        expect(await getProfileAction()).toEqual({
            success: false,
            error: 'User not authenticated',
        })
    })

    it('只查自己的資料', async () => {
        collection('users').findOne.mockResolvedValue(makeUserDoc())

        await getProfileAction()

        expect(collection('users').findOne).toHaveBeenCalledWith({ _id: new ObjectId(USER_ID) })
    })

    it('回傳個人資料，不含密碼雜湊', async () => {
        collection('users').findOne.mockResolvedValue(makeUserDoc())

        const result = await getProfileAction()

        expect(result).toEqual({
            success: true,
            profile: {
                nickname: '阿明',
                bio: '哈囉',
                avatar: 'https://example.com/avatar.png',
                name: '小明',
                email: 'ming@example.com',
            },
        })
        expect(JSON.stringify(result)).not.toContain('$2a$12$hashed')
    })

    it('選填欄位缺漏時補空字串', async () => {
        collection('users').findOne.mockResolvedValue({
            _id: new ObjectId(USER_ID),
            email: 'ming@example.com',
        })

        const result = await getProfileAction()

        expect(result).toMatchObject({
            success: true,
            profile: { nickname: '', bio: '', avatar: '', name: '' },
        })
    })

    it('查無使用者時回傳錯誤', async () => {
        collection('users').findOne.mockResolvedValue(null)

        expect(await getProfileAction()).toEqual({ success: false, error: 'User not found' })
    })

    it('資料庫出錯時回傳錯誤', async () => {
        collection('users').findOne.mockRejectedValue(new Error('boom'))

        expect(await getProfileAction()).toEqual({
            success: false,
            error: 'Internal server error',
        })
    })
})

describe('updateProfileAction', () => {
    it('未登入時拒絕', async () => {
        requireAuth.mockResolvedValue({ authenticated: false, error: 'User not authenticated' })

        await updateProfileAction('阿明', '哈囉')

        expect(collection('users').updateOne).not.toHaveBeenCalled()
    })

    it('暱稱超過 20 字時拒絕，且不寫入資料庫', async () => {
        const result = await updateProfileAction('a'.repeat(21), '')

        expect(result).toEqual({ success: false, error: '暱稱不能超過 20 個字' })
        expect(collection('users').updateOne).not.toHaveBeenCalled()
    })

    it('剛好 20 字的暱稱可以通過', async () => {
        const result = await updateProfileAction('a'.repeat(20), '')

        expect(result.success).toBe(true)
    })

    it('自我介紹超過 200 字時拒絕', async () => {
        const result = await updateProfileAction('阿明', 'b'.repeat(201))

        expect(result).toEqual({ success: false, error: '自我介紹不能超過 200 個字' })
        expect(collection('users').updateOne).not.toHaveBeenCalled()
    })

    it('剛好 200 字的自我介紹可以通過', async () => {
        const result = await updateProfileAction('阿明', 'b'.repeat(200))

        expect(result.success).toBe(true)
    })

    it('寫入時去除前後空白，並只更新自己的文件', async () => {
        await updateProfileAction('  阿明  ', '  哈囉  ')

        expect(collection('users').updateOne).toHaveBeenCalledWith(
            { _id: new ObjectId(USER_ID) },
            { $set: { nickname: '阿明', bio: '哈囉' } }
        )
    })

    it('成功後回傳更新後的欄位', async () => {
        const result = await updateProfileAction('阿明', '哈囉')

        expect(result).toEqual({
            success: true,
            message: '個人資料已更新',
            profile: { nickname: '阿明', bio: '哈囉' },
        })
    })

    it('長度檢查是在裁掉空白之前做的', async () => {
        // 20 個字加上前後空白會超過 20，目前的實作會擋下來。
        // 這裡把行為釘住，日後若要改成先 trim 再檢查會有測試提醒。
        const result = await updateProfileAction(` ${'a'.repeat(20)} `, '')

        expect(result).toEqual({ success: false, error: '暱稱不能超過 20 個字' })
    })

    it('資料庫出錯時回傳錯誤', async () => {
        collection('users').updateOne.mockRejectedValue(new Error('boom'))

        expect(await updateProfileAction('阿明', '哈囉')).toEqual({
            success: false,
            error: 'Internal server error',
        })
    })
})
