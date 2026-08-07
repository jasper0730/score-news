import { beforeEach, describe, expect, it, vi } from 'vitest'
import { collection } from '@/test/helpers/db'
import { makeUser, USER_ID } from '@/test/helpers/fixtures'

vi.mock('@/libs/db', async () => ({
    getCollection: (await import('@/test/helpers/db')).getCollection,
}))

const requireAuth = vi.hoisted(() => vi.fn())
vi.mock('@/libs/auth', () => ({ requireAuth }))

const { toggleFavoriteAction } = await import('@/actions/favoriteActions')

beforeEach(() => {
    requireAuth.mockResolvedValue({ authenticated: true, user: makeUser() })
})

describe('toggleFavoriteAction', () => {
    it('未登入時拒絕，且完全不碰資料庫', async () => {
        requireAuth.mockResolvedValue({ authenticated: false, error: 'User not authenticated' })

        const result = await toggleFavoriteAction('news-1')

        expect(result).toEqual({ success: false, error: 'User not authenticated' })
        expect(collection('favorites').findOne).not.toHaveBeenCalled()
    })

    it('沒有 postId 時拒絕', async () => {
        const result = await toggleFavoriteAction('')

        expect(result).toEqual({ success: false, error: 'Post ID is required' })
        expect(collection('favorites').updateOne).not.toHaveBeenCalled()
    })

    it('尚未收藏過就加入收藏', async () => {
        collection('favorites').findOne.mockResolvedValue({ userId: USER_ID, postIds: ['other'] })

        const result = await toggleFavoriteAction('news-1')

        expect(collection('favorites').updateOne).toHaveBeenCalledWith(
            { userId: USER_ID },
            { $addToSet: { postIds: 'news-1' } },
            { upsert: true }
        )
        expect(result).toMatchObject({ success: true, favorited: true })
    })

    it('第一次收藏（還沒有收藏文件）時建立文件', async () => {
        collection('favorites').findOne.mockResolvedValue(null)

        const result = await toggleFavoriteAction('news-1')

        // upsert 讓第一次收藏不需要另外先 insert
        expect(collection('favorites').updateOne).toHaveBeenCalledWith(
            { userId: USER_ID },
            { $addToSet: { postIds: 'news-1' } },
            { upsert: true }
        )
        expect(result.success).toBe(true)
    })

    it('已收藏過就取消收藏', async () => {
        collection('favorites').findOne.mockResolvedValue({
            userId: USER_ID,
            postIds: ['news-1'],
        })

        const result = await toggleFavoriteAction('news-1')

        expect(collection('favorites').updateOne).toHaveBeenCalledWith(
            { userId: USER_ID },
            { $pull: { postIds: 'news-1' } }
        )
        expect(result).toMatchObject({ success: true, favorited: false })
    })

    it('回傳伺服器算出的收藏總數，而不是讓前端自行加減', async () => {
        collection('favorites').findOne.mockResolvedValue(null)
        collection('favorites').countDocuments.mockResolvedValue(37)

        const result = await toggleFavoriteAction('news-1')

        // 收藏是「一位使用者一份文件、postIds 陣列」，
        // 所以某篇的收藏數 = 有幾份文件的 postIds 含有它
        expect(collection('favorites').countDocuments).toHaveBeenCalledWith({ postIds: 'news-1' })
        expect(result).toMatchObject({ favorites: 37 })
    })

    it('只操作自己的收藏文件', async () => {
        collection('favorites').findOne.mockResolvedValue(null)

        await toggleFavoriteAction('news-1')

        expect(collection('favorites').findOne).toHaveBeenCalledWith({ userId: USER_ID })
    })

    it('資料庫出錯時回傳錯誤而不是丟出例外', async () => {
        collection('favorites').findOne.mockRejectedValue(new Error('boom'))

        const result = await toggleFavoriteAction('news-1')

        expect(result).toEqual({ success: false, error: 'Internal server error' })
    })
})
