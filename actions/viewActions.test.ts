import { describe, expect, it, vi } from 'vitest'
import { collection } from '@/test/helpers/db'
import { makeNewsDoc } from '@/test/helpers/fixtures'

vi.mock('@/libs/db', async () => ({
    getCollection: (await import('@/test/helpers/db')).getCollection,
}))

const { incrementViewAction } = await import('@/actions/viewActions')

describe('incrementViewAction', () => {
    it('以 $inc 累加，避免讀取後再寫回造成的競態', async () => {
        collection('news').findOneAndUpdate.mockResolvedValue(makeNewsDoc({ views: 6 }))

        await incrementViewAction('news-1')

        expect(collection('news').findOneAndUpdate).toHaveBeenCalledWith(
            { article_id: 'news-1' },
            { $inc: { views: 1 } },
            { returnDocument: 'after' }
        )
    })

    it('回傳累加後的次數', async () => {
        collection('news').findOneAndUpdate.mockResolvedValue(makeNewsDoc({ views: 6 }))

        expect(await incrementViewAction('news-1')).toEqual({ success: true, views: 6 })
    })

    it('找不到文章時回傳 1（不讓畫面上的數字變成 undefined）', async () => {
        collection('news').findOneAndUpdate.mockResolvedValue(null)

        expect(await incrementViewAction('missing')).toEqual({ success: true, views: 1 })
    })

    it('資料庫出錯時回傳失敗，瀏覽數不是關鍵資料所以不丟例外', async () => {
        collection('news').findOneAndUpdate.mockRejectedValue(new Error('boom'))

        expect(await incrementViewAction('news-1')).toEqual({ success: false, views: 0 })
    })
})
