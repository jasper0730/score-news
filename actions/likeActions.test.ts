import { beforeEach, describe, expect, it, vi } from 'vitest'
import { collection } from '@/test/helpers/db'
import { makeUser, USER_ID } from '@/test/helpers/fixtures'

vi.mock('@/libs/db', async () => ({
    getCollection: (await import('@/test/helpers/db')).getCollection,
}))

const requireAuth = vi.hoisted(() => vi.fn())
vi.mock('@/libs/auth', () => ({ requireAuth }))

const { toggleLikeAction } = await import('@/actions/likeActions')

beforeEach(() => {
    requireAuth.mockResolvedValue({ authenticated: true, user: makeUser() })
    collection('likes').countDocuments.mockResolvedValue(0)
})

describe('toggleLikeAction', () => {
    it('未登入時拒絕，且完全不碰資料庫', async () => {
        requireAuth.mockResolvedValue({ authenticated: false, error: 'User not authenticated' })

        const result = await toggleLikeAction('news-1')

        expect(result).toEqual({ success: false, error: 'User not authenticated' })
        expect(collection('likes').deleteOne).not.toHaveBeenCalled()
    })

    it('沒有 postId 時拒絕', async () => {
        const result = await toggleLikeAction('')

        expect(result).toEqual({ success: false, error: 'Post ID is required' })
        expect(collection('likes').deleteOne).not.toHaveBeenCalled()
    })

    it('尚未按讚時新增一筆', async () => {
        collection('likes').deleteOne.mockResolvedValue({ deletedCount: 0 })
        collection('likes').countDocuments.mockResolvedValue(1)

        const result = await toggleLikeAction('news-1')

        expect(collection('likes').insertOne).toHaveBeenCalledWith({
            userId: USER_ID,
            postId: 'news-1',
        })
        expect(result).toEqual({ success: true, liked: true, likes: 1 })
    })

    it('已按過讚時取消', async () => {
        collection('likes').deleteOne.mockResolvedValue({ deletedCount: 1 })
        collection('likes').countDocuments.mockResolvedValue(4)

        const result = await toggleLikeAction('news-1')

        expect(collection('likes').insertOne).not.toHaveBeenCalled()
        expect(result).toEqual({ success: true, liked: false, likes: 4 })
    })

    it('用刪除的結果判斷原本狀態，省掉一次查詢', async () => {
        collection('likes').deleteOne.mockResolvedValue({ deletedCount: 0 })

        await toggleLikeAction('news-1')

        expect(collection('likes').deleteOne).toHaveBeenCalledWith({
            userId: USER_ID,
            postId: 'news-1',
        })
        expect(collection('likes').findOne).not.toHaveBeenCalled()
    })

    it('只操作自己的按讚紀錄', async () => {
        collection('likes').deleteOne.mockResolvedValue({ deletedCount: 1 })

        await toggleLikeAction('news-1')

        const filter = collection('likes').deleteOne.mock.calls[0]?.[0]
        expect(filter.userId).toBe(USER_ID)
    })

    it('回傳伺服器算出的總數，而不是讓前端自行加減', async () => {
        // 同一篇可能同時有其他人在按，前端自己算會越來越偏離真實值
        collection('likes').deleteOne.mockResolvedValue({ deletedCount: 0 })
        collection('likes').countDocuments.mockResolvedValue(87)

        const result = await toggleLikeAction('news-1')

        expect(collection('likes').countDocuments).toHaveBeenCalledWith({ postId: 'news-1' })
        expect(result).toMatchObject({ likes: 87 })
    })

    it('資料庫出錯時回傳錯誤而不是丟出例外', async () => {
        collection('likes').deleteOne.mockRejectedValue(new Error('boom'))

        expect(await toggleLikeAction('news-1')).toEqual({
            success: false,
            error: 'Internal server error',
        })
    })
})
