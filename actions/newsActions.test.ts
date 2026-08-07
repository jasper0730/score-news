import { beforeEach, describe, expect, it, vi } from 'vitest'
import { collection } from '@/test/helpers/db'
import { makeNewsDoc, OTHER_USER_ID, USER_ID } from '@/test/helpers/fixtures'

vi.mock('@/libs/db', async () => ({
    getCollection: (await import('@/test/helpers/db')).getCollection,
}))

const getSession = vi.hoisted(() => vi.fn())
vi.mock('@/actions/getUser', () => ({ getSession }))

const { getNewsActions, getNewsByIds, getFavoriteNewsAction } =
    await import('@/actions/newsActions')

/** 登入狀態的 session；未登入則回 null */
function signedIn(userId = USER_ID) {
    getSession.mockResolvedValue({ user: { id: userId, email: 'ming@example.com' } })
}

beforeEach(() => {
    getSession.mockResolvedValue(null)
})

describe('getNewsActions', () => {
    describe('查詢組成', () => {
        it('預設查第一頁、每頁 12 筆、依發佈時間新到舊', async () => {
            const news = collection('news')

            await getNewsActions()

            expect(news.find).toHaveBeenCalledWith({})
            expect(news.cursor.sort).toHaveBeenCalledWith({ pubDate: -1 })
            expect(news.cursor.skip).toHaveBeenCalledWith(0)
            expect(news.cursor.limit).toHaveBeenCalledWith(12)
        })

        it('有搜尋字串時同時比對標題與描述（不分大小寫）', async () => {
            const news = collection('news')

            await getNewsActions({ query: '颱風' })

            const expectedFilter = {
                $or: [
                    { title: { $regex: '颱風', $options: 'i' } },
                    { description: { $regex: '颱風', $options: 'i' } },
                ],
            }
            expect(news.find).toHaveBeenCalledWith(expectedFilter)
            expect(news.countDocuments).toHaveBeenCalledWith(expectedFilter)
        })

        it.each([
            ['date_desc', { pubDate: -1 }],
            ['views', { views: -1, pubDate: -1 }],
        ] as const)('sortType=%s 對應排序條件 %o', async (sortType, expected) => {
            const news = collection('news')

            await getNewsActions({ sortType })

            expect(news.cursor.sort).toHaveBeenCalledWith(expected)
        })

        it('最多點閱走一般查詢而非 aggregate——views 是文件上的欄位且有索引', async () => {
            const news = collection('news')

            await getNewsActions({ sortType: 'views' })

            expect(news.find).toHaveBeenCalled()
            expect(news.aggregate).not.toHaveBeenCalled()
        })

        it('第 3 頁會跳過前面兩頁的筆數', async () => {
            const news = collection('news')

            await getNewsActions({ page: 3, limit: 10 })

            expect(news.cursor.skip).toHaveBeenCalledWith(20)
            expect(news.cursor.limit).toHaveBeenCalledWith(10)
        })
    })

    describe('依評分排序', () => {
        it('改走 aggregate，因為 avgRating 是算出來的欄位無法用索引排序', async () => {
            const news = collection('news')
            news.aggregateCursor.toArray.mockResolvedValue([
                { metadata: [{ total: 1 }], data: [makeNewsDoc({ avgRating: 4.5 })] },
            ])

            const result = await getNewsActions({ sortType: 'rating_desc' })

            expect(news.find).not.toHaveBeenCalled()
            expect(news.aggregate).toHaveBeenCalledOnce()
            expect(result.data[0]?.rate).toBe(4.5)
        })

        it.each(['rating_desc', 'favorites', 'likes'] as const)(
            '%s 由高到低排序',
            async (sortType) => {
                const news = collection('news')

                await getNewsActions({ sortType })

                const pipeline = news.aggregate.mock.calls[0]?.[0] as Record<string, unknown>[]
                const sortStage = pipeline.find((stage) => '$sort' in stage)
                expect(sortStage).toEqual({ $sort: { sortValue: -1, pubDate: -1 } })
            }
        )

        it('同分時以發佈時間為次要條件，翻頁順序才穩定', async () => {
            // 沒有次要條件的話，同分文章在不同頁的排序不保證一致，
            // 無限捲動會出現重複或漏掉的項目
            const news = collection('news')

            await getNewsActions({ sortType: 'likes' })

            const pipeline = news.aggregate.mock.calls[0]?.[0] as Record<string, unknown>[]
            const sortStage = pipeline.find((stage) => '$sort' in stage) as {
                $sort: Record<string, number>
            }
            expect(Object.keys(sortStage.$sort)).toEqual(['sortValue', 'pubDate'])
        })

        it('分頁在 $facet 內完成，總數與資料一次取回', async () => {
            const news = collection('news')
            news.aggregateCursor.toArray.mockResolvedValue([
                { metadata: [{ total: 30 }], data: [makeNewsDoc()] },
            ])

            const result = await getNewsActions({ sortType: 'rating_desc', page: 2, limit: 12 })

            const pipeline = news.aggregate.mock.calls[0]?.[0] as Record<string, unknown>[]
            const facetStage = pipeline.find((stage) => '$facet' in stage) as {
                $facet: { data: unknown[] }
            }
            expect(facetStage.$facet.data).toEqual([{ $skip: 12 }, { $limit: 12 }])
            expect(result.total).toBe(30)
        })

        it('最多讚：從 likes collection 算數量', async () => {
            const news = collection('news')

            await getNewsActions({ sortType: 'likes' })

            const pipeline = news.aggregate.mock.calls[0]?.[0] as Record<string, unknown>[]
            const lookup = pipeline.find((s) => '$lookup' in s) as {
                $lookup: { from: string; foreignField?: string }
            }
            const addFields = pipeline.find((s) => '$addFields' in s) as {
                $addFields: { sortValue: unknown }
            }
            expect(lookup.$lookup.from).toBe('likes')
            expect(lookup.$lookup.foreignField).toBe('postId')
            expect(addFields.$addFields.sortValue).toEqual({ $size: '$sortSource' })
        })

        it('最多收藏：收藏是陣列結構，要用 pipeline 形式的 $lookup 比對', async () => {
            // favorites 是「一位使用者一份文件、postIds 陣列」，
            // 沒辦法像 likes 那樣用 localField/foreignField 直接對應
            const news = collection('news')

            await getNewsActions({ sortType: 'favorites' })

            const pipeline = news.aggregate.mock.calls[0]?.[0] as Record<string, unknown>[]
            const lookup = pipeline.find((s) => '$lookup' in s) as {
                $lookup: { from: string; pipeline?: unknown[]; localField?: string }
            }
            expect(lookup.$lookup.from).toBe('favorites')
            expect(lookup.$lookup.localField).toBeUndefined()
            expect(lookup.$lookup.pipeline).toBeDefined()
        })

        it('lookup 的中介欄位不會被送回前端', async () => {
            const news = collection('news')

            await getNewsActions({ sortType: 'likes' })

            const pipeline = news.aggregate.mock.calls[0]?.[0] as Record<string, unknown>[]
            expect(pipeline).toContainEqual({ $project: { sortSource: 0 } })
        })

        it('aggregate 回空陣列時不會炸掉，總數為 0', async () => {
            collection('news').aggregateCursor.toArray.mockResolvedValue([])

            const result = await getNewsActions({ sortType: 'rating_desc' })

            expect(result).toMatchObject({ success: true, data: [], total: 0, hasMore: false })
        })
    })

    describe('使用者資料的合併', () => {
        it('userId 取自 session，不接受呼叫端傳入', async () => {
            // 這是 client 可直接呼叫的 server action。若信任參數，
            // 任何人都能帶別人的 id 讀取他人的收藏與個人評分。
            signedIn(USER_ID)
            const news = collection('news')
            news.cursor.toArray.mockResolvedValue([makeNewsDoc()])

            await getNewsActions({ userId: OTHER_USER_ID } as never)

            expect(collection('favorites').findOne).toHaveBeenCalledWith({ userId: USER_ID })
            expect(collection('ratings').find).toHaveBeenCalledWith({
                userId: USER_ID,
                postId: { $in: ['news-1'] },
            })
        })

        it('未登入時不查收藏，所有項目 favorite 為 false', async () => {
            const news = collection('news')
            news.cursor.toArray.mockResolvedValue([makeNewsDoc()])

            const result = await getNewsActions()

            expect(collection('favorites').findOne).not.toHaveBeenCalled()
            expect(result.data[0]?.favorite).toBe(false)
            expect(result.data[0]?.userRate).toBeUndefined()
        })

        it('標記出使用者收藏過的新聞', async () => {
            signedIn()
            collection('news').cursor.toArray.mockResolvedValue([
                makeNewsDoc({ article_id: 'a' }),
                makeNewsDoc({ article_id: 'b' }),
            ])
            collection('favorites').findOne.mockResolvedValue({ userId: USER_ID, postIds: ['b'] })

            const result = await getNewsActions()

            expect(result.data.map((n) => n.favorite)).toEqual([false, true])
        })

        it('收藏文件存在但沒有 postIds 欄位時視為沒有收藏', async () => {
            signedIn()
            collection('news').cursor.toArray.mockResolvedValue([makeNewsDoc()])
            collection('favorites').findOne.mockResolvedValue({ userId: USER_ID })

            const result = await getNewsActions()

            expect(result.data[0]?.favorite).toBe(false)
        })

        it('帶入平均評分與使用者自己的評分', async () => {
            signedIn()
            collection('news').cursor.toArray.mockResolvedValue([makeNewsDoc({ article_id: 'a' })])
            collection('ratings').aggregateCursor.toArray.mockResolvedValue([
                { _id: 'a', avgRating: 3.5 },
            ])
            collection('ratings').cursor.toArray.mockResolvedValue([
                { userId: USER_ID, postId: 'a', rate: 5 },
            ])

            const result = await getNewsActions()

            expect(result.data[0]).toMatchObject({ rate: 3.5, userRate: 5 })
        })

        it('沒有人評分過的新聞 rate 為 0', async () => {
            collection('news').cursor.toArray.mockResolvedValue([makeNewsDoc()])

            const result = await getNewsActions()

            expect(result.data[0]?.rate).toBe(0)
        })

        it('這一頁沒有任何資料時不會多打評分查詢', async () => {
            signedIn()
            collection('news').cursor.toArray.mockResolvedValue([])

            await getNewsActions()

            expect(collection('ratings').aggregate).not.toHaveBeenCalled()
            expect(collection('ratings').find).not.toHaveBeenCalled()
        })
    })

    describe('回傳內容', () => {
        it('只輸出白名單欄位，不外洩 _id 之類的內部欄位', async () => {
            collection('news').cursor.toArray.mockResolvedValue([makeNewsDoc()])

            const result = await getNewsActions()

            expect(Object.keys(result.data[0] ?? {}).sort()).toEqual(
                [
                    'article_id',
                    'content',
                    'description',
                    'favorite',
                    'favorites',
                    'image_url',
                    'liked',
                    'likes',
                    'link',
                    'pubDate',
                    'rate',
                    'source_icon',
                    'source_name',
                    'source_url',
                    'title',
                    'userRate',
                    'views',
                ].sort()
            )
            expect(result.data[0]).not.toHaveProperty('_id')
        })

        it('views 缺漏時補 0', async () => {
            collection('news').cursor.toArray.mockResolvedValue([makeNewsDoc({ views: undefined })])

            const result = await getNewsActions()

            expect(result.data[0]?.views).toBe(0)
        })

        it.each([
            [1, 12, 30, true],
            [2, 12, 30, true],
            [3, 12, 30, false],
        ])('page=%i limit=%i total=%i 時 hasMore 為 %s', async (page, limit, total, expected) => {
            const pageSize = Math.min(limit, Math.max(total - (page - 1) * limit, 0))
            collection('news').cursor.toArray.mockResolvedValue(
                Array.from({ length: pageSize }, (_, i) => makeNewsDoc({ article_id: `a${i}` }))
            )
            collection('news').countDocuments.mockResolvedValue(total)

            const result = await getNewsActions({ page, limit })

            expect(result.hasMore).toBe(expected)
        })
    })

    it('查詢失敗時回傳失敗結果而不是丟出例外', async () => {
        collection('news').cursor.toArray.mockRejectedValue(new Error('連線中斷'))

        const result = await getNewsActions()

        expect(result).toEqual({
            success: false,
            data: [],
            message: '連線中斷',
            hasMore: false,
            total: 0,
        })
    })
})

describe('getNewsByIds', () => {
    it('沒有傳 id 就直接回空陣列，不打資料庫', async () => {
        const result = await getNewsByIds([])

        expect(result).toEqual({ success: true, data: [] })
        expect(collection('news').find).not.toHaveBeenCalled()
    })

    it('依 id 取新聞並帶上平均評分', async () => {
        collection('news').cursor.toArray.mockResolvedValue([makeNewsDoc({ article_id: 'a' })])
        collection('ratings').aggregateCursor.toArray.mockResolvedValue([
            { _id: 'a', avgRating: 2 },
        ])

        const result = await getNewsByIds(['a'])

        expect(collection('news').find).toHaveBeenCalledWith({ article_id: { $in: ['a'] } })
        expect(result.data[0]).toMatchObject({ article_id: 'a', rate: 2, favorite: false })
    })

    it('查詢失敗時回傳 success:false', async () => {
        collection('news').cursor.toArray.mockRejectedValue(new Error('boom'))

        expect(await getNewsByIds(['a'])).toEqual({ success: false, data: [] })
    })
})

describe('getFavoriteNewsAction', () => {
    it('未登入時回傳失敗', async () => {
        const result = await getFavoriteNewsAction()

        expect(result).toEqual({ success: false, data: [] })
        expect(collection('favorites').findOne).not.toHaveBeenCalled()
    })

    it('沒有收藏時回空陣列，不去查新聞', async () => {
        signedIn()
        collection('favorites').findOne.mockResolvedValue({ userId: USER_ID, postIds: [] })

        const result = await getFavoriteNewsAction()

        expect(result).toEqual({ success: true, data: [] })
        expect(collection('news').find).not.toHaveBeenCalled()
    })

    it('只取收藏清單上的那幾筆，而不是撈全部再於前端過濾', async () => {
        signedIn()
        collection('favorites').findOne.mockResolvedValue({ userId: USER_ID, postIds: ['a', 'b'] })
        collection('news').cursor.toArray.mockResolvedValue([makeNewsDoc({ article_id: 'a' })])

        await getFavoriteNewsAction()

        expect(collection('news').find).toHaveBeenCalledWith({ article_id: { $in: ['a', 'b'] } })
    })

    it('結果一律標記為已收藏', async () => {
        signedIn()
        collection('favorites').findOne.mockResolvedValue({ userId: USER_ID, postIds: ['a'] })
        collection('news').cursor.toArray.mockResolvedValue([makeNewsDoc({ article_id: 'a' })])

        const result = await getFavoriteNewsAction()

        expect(result.data[0]?.favorite).toBe(true)
    })

    it('查詢失敗時回傳 success:false', async () => {
        signedIn()
        collection('favorites').findOne.mockRejectedValue(new Error('boom'))

        expect(await getFavoriteNewsAction()).toEqual({ success: false, data: [] })
    })
})
