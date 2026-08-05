import { beforeEach, describe, expect, it, vi } from 'vitest'
import { collection } from '@/test/helpers/db'
import { makeUser, USER_ID } from '@/test/helpers/fixtures'

vi.mock('@/libs/db', async () => ({
    getCollection: (await import('@/test/helpers/db')).getCollection,
}))

const requireAuth = vi.hoisted(() => vi.fn())
vi.mock('@/libs/auth', () => ({ requireAuth }))

const { rateNewsAction } = await import('@/actions/rateNewsAction')

beforeEach(() => {
    requireAuth.mockResolvedValue({ authenticated: true, user: makeUser() })
})

describe('rateNewsAction', () => {
    it('未登入時拒絕評分', async () => {
        requireAuth.mockResolvedValue({ authenticated: false, error: 'User not authenticated' })

        const result = await rateNewsAction('news-1', 5)

        expect(result).toEqual({ success: false, error: 'User not authenticated', rate: 0 })
        expect(collection('ratings').insertOne).not.toHaveBeenCalled()
    })

    it('沒有 postId 時拒絕', async () => {
        const result = await rateNewsAction('', 5)

        expect(result).toEqual({ success: false, error: 'Post ID is required', rate: 0 })
    })

    it('第一次評分時新增紀錄', async () => {
        collection('ratings').findOne.mockResolvedValue(null)

        await rateNewsAction('news-1', 4)

        expect(collection('ratings').insertOne).toHaveBeenCalledWith({
            userId: USER_ID,
            postId: 'news-1',
            rate: 4,
        })
        expect(collection('ratings').updateOne).not.toHaveBeenCalled()
    })

    it('重複評分時更新原本的紀錄，而不是多存一筆', async () => {
        collection('ratings').findOne.mockResolvedValue({
            userId: USER_ID,
            postId: 'news-1',
            rate: 2,
        })

        await rateNewsAction('news-1', 5)

        expect(collection('ratings').updateOne).toHaveBeenCalledWith(
            { userId: USER_ID, postId: 'news-1' },
            { $set: { rate: 5 } }
        )
        expect(collection('ratings').insertOne).not.toHaveBeenCalled()
    })

    it('回傳這篇新聞的最新平均分數', async () => {
        collection('ratings').findOne.mockResolvedValue(null)
        collection('ratings').aggregateCursor.toArray.mockResolvedValue([
            { _id: 'news-1', avgRating: 3.75 },
        ])

        const result = await rateNewsAction('news-1', 4)

        expect(result).toEqual({ success: true, rate: 3.75 })
    })

    it('平均值算不出來時退回這次送出的分數', async () => {
        collection('ratings').findOne.mockResolvedValue(null)
        collection('ratings').aggregateCursor.toArray.mockResolvedValue([])

        const result = await rateNewsAction('news-1', 4)

        expect(result).toEqual({ success: true, rate: 4 })
    })

    it('只統計這一篇的評分', async () => {
        collection('ratings').findOne.mockResolvedValue(null)

        await rateNewsAction('news-1', 4)

        const pipeline = collection('ratings').aggregate.mock.calls[0]?.[0] as Record<
            string,
            unknown
        >[]
        expect(pipeline[0]).toEqual({ $match: { postId: 'news-1' } })
    })

    it('資料庫出錯時回傳錯誤', async () => {
        collection('ratings').findOne.mockRejectedValue(new Error('boom'))

        const result = await rateNewsAction('news-1', 4)

        expect(result).toEqual({ success: false, error: 'Internal server error', rate: 0 })
    })
})
