'use server'

import type { Collection, Sort, WithId } from 'mongodb'
import {
    getCollection,
    type NewsDocument,
    type FavoriteDocument,
    type CommentDocument,
    type LikeDocument,
} from '@/libs/db'
import type { NewsDataType, SortType } from '@/types/news'
import { getSession } from '@/actions/getUser'

/** 走 aggregate 時會多帶一個算出來的 sortValue，但那不需要回傳給前端 */
type NewsQueryDocument = WithId<NewsDocument>

/**
 * 把資料庫 document 轉成前端型別。
 * 刻意逐欄列出而非展開 document：欄位對不上時會在這裡編譯失敗，
 * 而不是等到畫面上少一塊才發現，也順帶擋住 _id 之類的內部欄位外流。
 */
const toNewsData = (
    doc: NewsQueryDocument,
    extra: {
        rate: number
        favorite: boolean
        favorites: number
        likes: number
        liked: boolean
        userRate?: number
    }
): NewsDataType => ({
    article_id: doc.article_id,
    title: doc.title,
    description: doc.description,
    content: doc.content,
    link: doc.link,
    image_url: doc.image_url,
    pubDate: doc.pubDate,
    source_icon: doc.source_icon,
    source_name: doc.source_name,
    source_url: doc.source_url,
    views: doc.views ?? 0,
    ...extra,
})

export interface GetNewsParams {
    query?: string
    sortType?: SortType
    page?: number
    limit?: number
}

/** 發燒榜只看 24 小時內的文章——再舊的就不叫「即時」了 */
const TRENDING_WINDOW_HOURS = 24

/**
 * 熱度公式分母的平滑常數（小時）。
 *
 * 純粹的「互動數 ÷ 發布至今的時數」會被剛發布的文章洗版：
 * 1 分鐘前發布、只有 1 次瀏覽的文章，分數是 1 ÷ (1/60) = 60，
 * 反而贏過 3 小時前累積 100 次瀏覽的文章（100 ÷ 3 = 33）。
 * 分母加一個常數可以壓掉分母趨近 0 時的爆炸，是 Hacker News 排序的同一個做法。
 */
const TRENDING_SMOOTHING_HOURS = 2

/**
 * 這些排序依據都不是新聞文件上的欄位，得先 $lookup 其他 collection 算出來，
 * 因此無法用一般索引排序，只能走 aggregate。
 */
const AGGREGATED_SORTS = ['favorites', 'likes', 'trending'] as const
type AggregatedSort = (typeof AGGREGATED_SORTS)[number]

const usesAggregateSort = (sortType: SortType): sortType is AggregatedSort =>
    (AGGREGATED_SORTS as readonly string[]).includes(sortType)

/**
 * 可以直接用索引排序的選項。
 * views 是新聞文件上的欄位（有 views_desc 索引），不像收藏與按讚
 * 需要 $lookup 其他 collection，所以走一般查詢就好，成本低得多。
 */
const SORT_OPTIONS: Record<Exclude<SortType, AggregatedSort>, Sort> = {
    date_desc: { pubDate: -1 },
    views: { views: -1, pubDate: -1 },
}

const LIKES_LOOKUP = {
    from: 'likes',
    localField: 'article_id',
    foreignField: 'postId',
    as: 'sortSource',
}

/**
 * 收藏的結構是「一位使用者一份文件、postIds 陣列」，比對條件是
 * 「該文件的 postIds 包含這篇的 article_id」，與按讚的 localField 對
 * foreignField 不同，得用 pipeline 形式的 $lookup。
 */
const FAVORITES_LOOKUP = {
    from: 'favorites',
    let: { articleId: '$article_id' },
    pipeline: [{ $match: { $expr: { $in: ['$$articleId', { $ifNull: ['$postIds', []] }] } } }],
    as: 'sortSource',
}

interface AggregatePlan {
    lookup: Record<string, unknown>
    /** 算出排序依據，結果放進 sortValue */
    sortValue: Record<string, unknown>
    /** 額外的篩選條件，例如發燒榜的時間窗 */
    extraMatch?: Record<string, unknown>
}

/**
 * pubDate 是 'YYYY-MM-DD HH:mm:ss' 的台北時間字串。
 * 零填補的格式讓字典序等於時間序，所以時間窗可以直接用字串比大小。
 */
function taipeiTimestamp(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(date)
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
    const hour = get('hour') === '24' ? '00' : get('hour')
    return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`
}

/** 排序方式 → aggregate 的組成。發燒榜要用到「現在」，因此收成函式 */
function buildAggregatePlan(sortType: AggregatedSort, now: Date): AggregatePlan {
    if (sortType === 'likes') {
        return { lookup: LIKES_LOOKUP, sortValue: { $size: '$sortSource' } }
    }
    if (sortType === 'favorites') {
        return { lookup: FAVORITES_LOOKUP, sortValue: { $size: '$sortSource' } }
    }

    // 即時發燒：(按讚數 + 瀏覽數) ÷ (發布至今的小時數 + 平滑常數)
    const cutoff = taipeiTimestamp(new Date(now.getTime() - TRENDING_WINDOW_HOURS * 3_600_000))
    const hoursSincePublish = {
        $divide: [
            {
                $subtract: [
                    now,
                    // pubDate 存成字串，要先轉回時間才能相減
                    {
                        $dateFromString: {
                            dateString: '$pubDate',
                            format: '%Y-%m-%d %H:%M:%S',
                            timezone: 'Asia/Taipei',
                            onError: now,
                        },
                    },
                ],
            },
            3_600_000,
        ],
    }

    return {
        lookup: LIKES_LOOKUP,
        extraMatch: { pubDate: { $gte: cutoff } },
        sortValue: {
            $divide: [
                { $add: [{ $size: '$sortSource' }, { $ifNull: ['$views', 0] }] },
                { $add: [hoursSincePublish, TRENDING_SMOOTHING_HOURS] },
            ],
        },
    }
}

/**
 * 計入平均評分的條件。
 *
 * 評分只存在於評論裡，所以 comments 是唯一來源。已刪除的評論不計入——
 * 包含管理員下架的：畫面上留墓碑，但因違規而隱藏的內容其評分沒有理由還算數。
 *
 * 這個常數與 commentActions 的 RATED_FILTER 是同一套規則。兩處分別宣告是因為
 * server action 之間互相 import 會把整個模組的相依一起拉進來，
 * 而這裡只需要一個查詢條件。
 */
const RATED_COMMENT_FILTER = { deletedAt: { $exists: false }, rating: { $gt: 0 } }

/** 一次算出多篇文章的平均評分 */
async function averageRatings(
    comments: Collection<CommentDocument>,
    postIds: string[]
): Promise<Map<string, number>> {
    const rows = await comments
        .aggregate([
            { $match: { postId: { $in: postIds }, ...RATED_COMMENT_FILTER } },
            { $group: { _id: '$postId', avgRating: { $avg: '$rating' } } },
        ])
        .toArray()
    return new Map(rows.map((r) => [r._id as string, r.avgRating as number]))
}

/**
 * 算出每篇文章被幾位使用者收藏。
 *
 * 收藏的結構是「一位使用者一份文件、postIds 陣列」，所以得先把陣列攤開。
 * 兩次 $match 是必要的：第一次縮小要處理的文件數（可用 postIds 索引），
 * 第二次濾掉攤開後那些不屬於本頁的收藏。
 */
async function countFavorites(
    favorites: Collection<FavoriteDocument>,
    postIds: string[]
): Promise<Map<string, number>> {
    const counts = await favorites
        .aggregate([
            { $match: { postIds: { $in: postIds } } },
            { $unwind: '$postIds' },
            { $match: { postIds: { $in: postIds } } },
            { $group: { _id: '$postIds', count: { $sum: 1 } } },
        ])
        .toArray()
    return new Map(counts.map((f) => [f._id as string, f.count as number]))
}

export type NewsResponse = {
    data: NewsDataType[]
    success: boolean
    message?: string
    hasMore: boolean
    total: number
}

export async function getNewsActions(params: GetNewsParams = {}): Promise<NewsResponse> {
    const { query = '', sortType = 'date_desc', page = 1, limit = 12 } = params

    try {
        // userId 一律由 server 端的 session 取得，不接受呼叫端傳入。
        // 這是 client 可直接呼叫的 server action，若信任參數，
        // 任何人都能帶別人的 id 讀取他人的收藏與個人評分。
        const session = await getSession()
        const userId = session?.user?.id ?? null

        const newsCollection = await getCollection<NewsDocument>('news')
        const favoritesCollection = await getCollection<FavoriteDocument>('favorites')
        const commentsCollection = await getCollection<CommentDocument>('comments')
        const likesCollection = await getCollection<LikeDocument>('likes')

        // Build Query
        const filter: Record<string, unknown> = {}
        if (query) {
            filter.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
            ]
        }

        const skip = (page - 1) * limit
        const byAggregate = usesAggregateSort(sortType)

        let allData: NewsQueryDocument[] = []
        let total = 0

        if (byAggregate) {
            const plan = buildAggregatePlan(sortType, new Date())
            const pipeline = [
                { $match: plan.extraMatch ? { ...filter, ...plan.extraMatch } : filter },
                { $lookup: plan.lookup },
                { $addFields: { sortValue: plan.sortValue } },
                // 次要條件用 pubDate，否則同分的文章在不同頁之間順序不穩定，
                // 無限捲動會出現重複或漏掉的項目
                { $sort: { sortValue: -1, pubDate: -1 } },
                // 中介欄位不需要送回來，它可能是整包 lookup 的結果
                { $project: { sortSource: 0 } },
                {
                    $facet: {
                        metadata: [{ $count: 'total' }],
                        data: [{ $skip: skip }, { $limit: limit }],
                    },
                },
            ]
            const aggResult = await newsCollection.aggregate(pipeline).toArray()
            // $facet 的結果是單一 document，但型別上仍是陣列，因此用 optional 存取
            const facet = aggResult[0] as
                | { data?: NewsQueryDocument[]; metadata?: { total: number }[] }
                | undefined
            allData = facet?.data ?? []
            total = facet?.metadata?.[0]?.total ?? 0
        } else {
            total = await newsCollection.countDocuments(filter)
            allData = await newsCollection
                .find(filter)
                // usesAggregateSort 是型別守衛，走到這裡 sortType 已被收窄成
                // 只剩日期兩種，直接查表不需要斷言
                .sort(SORT_OPTIONS[sortType])
                .skip(skip)
                .limit(limit)
                .toArray()
        }

        // Enrich with favorites
        let favoriteSet = new Set<string>()
        if (userId) {
            const userFavorites = await favoritesCollection.findOne({ userId })
            if (userFavorites?.postIds) {
                favoriteSet = new Set(userFavorites.postIds)
            }
        }

        // Enrich with ratings (avg + user's own rating)
        let ratingMap = new Map<string, number>()
        let userRatingMap = new Map<string, number>()
        let likeCountMap = new Map<string, number>()
        let likedSet = new Set<string>()
        let favoriteCountMap = new Map<string, number>()
        const postIds = allData.map((item) => item.article_id)

        if (postIds.length > 0) {
            favoriteCountMap = await countFavorites(favoritesCollection, postIds)

            // 只統計這一頁的文章，不要對整個 likes collection 做聚合
            const likeCounts = await likesCollection
                .aggregate([
                    { $match: { postId: { $in: postIds } } },
                    { $group: { _id: '$postId', count: { $sum: 1 } } },
                ])
                .toArray()
            likeCountMap = new Map(likeCounts.map((l) => [l._id as string, l.count as number]))

            if (userId) {
                const userLikes = await likesCollection
                    .find({ userId, postId: { $in: postIds } })
                    .toArray()
                likedSet = new Set(userLikes.map((l) => l.postId))
            }

            ratingMap = await averageRatings(commentsCollection, postIds)

            if (userId) {
                // 使用者自己的評分同樣來自他的評論，已刪除的不算
                const ownComments = await commentsCollection
                    .find({ userId, postId: { $in: postIds }, ...RATED_COMMENT_FILTER })
                    .toArray()
                userRatingMap = new Map(ownComments.map((c) => [c.postId, c.rating as number]))
            }
        }

        const enrichedData: NewsDataType[] = allData.map((item) =>
            toNewsData(item, {
                rate: ratingMap.get(item.article_id) ?? 0,
                favorite: favoriteSet.has(item.article_id),
                favorites: favoriteCountMap.get(item.article_id) ?? 0,
                likes: likeCountMap.get(item.article_id) ?? 0,
                liked: likedSet.has(item.article_id),
                userRate: userRatingMap.get(item.article_id),
            })
        )

        return {
            success: true,
            data: enrichedData,
            hasMore: total > skip + enrichedData.length,
            total,
        }
    } catch (error) {
        console.error('Failed to get news:', error)
        return {
            success: false,
            data: [],
            message: error instanceof Error ? error.message : '發生未知錯誤',
            hasMore: false,
            total: 0,
        }
    }
}

export async function getNewsByIds(
    articleIds: string[]
): Promise<{ success: boolean; data: NewsDataType[] }> {
    try {
        if (articleIds.length === 0) return { success: true, data: [] }

        const session = await getSession()
        const userId = session?.user?.id ?? null

        const newsCollection = await getCollection<NewsDocument>('news')
        const commentsCollection = await getCollection<CommentDocument>('comments')
        const likesCollection = await getCollection<LikeDocument>('likes')
        const favoritesCollection = await getCollection<FavoriteDocument>('favorites')

        const docs = await newsCollection.find({ article_id: { $in: articleIds } }).toArray()
        const favoriteCountMap = await countFavorites(favoritesCollection, articleIds)
        const ratingMap = await averageRatings(commentsCollection, articleIds)

        const likeCounts = await likesCollection
            .aggregate([
                { $match: { postId: { $in: articleIds } } },
                { $group: { _id: '$postId', count: { $sum: 1 } } },
            ])
            .toArray()
        const likeCountMap = new Map(likeCounts.map((l) => [l._id as string, l.count as number]))

        let likedSet = new Set<string>()
        if (userId) {
            const userLikes = await likesCollection
                .find({ userId, postId: { $in: articleIds } })
                .toArray()
            likedSet = new Set(userLikes.map((l) => l.postId))
        }

        const data: NewsDataType[] = docs.map((item) =>
            toNewsData(item, {
                rate: ratingMap.get(item.article_id) ?? 0,
                favorite: false,
                favorites: favoriteCountMap.get(item.article_id) ?? 0,
                likes: likeCountMap.get(item.article_id) ?? 0,
                liked: likedSet.has(item.article_id),
            })
        )

        return { success: true, data }
    } catch (error) {
        console.error('Failed to get news by ids:', error)
        return { success: false, data: [] }
    }
}

/**
 * 取得目前使用者收藏的新聞。
 *
 * 先前後台是呼叫 getNewsActions({ limit: 1000 }) 再於 client 端 filter
 * item.favorite，等於為了幾筆收藏把整個資料庫搬到瀏覽器。
 * 這裡改為先查收藏清單拿到 id，再只取那幾筆。
 */
export async function getFavoriteNewsAction(): Promise<{
    success: boolean
    data: NewsDataType[]
}> {
    try {
        const session = await getSession()
        const userId = session?.user?.id
        if (!userId) return { success: false, data: [] }

        const favoritesCollection = await getCollection<FavoriteDocument>('favorites')
        const favorites = await favoritesCollection.findOne({ userId })
        const postIds = favorites?.postIds ?? []
        if (postIds.length === 0) return { success: true, data: [] }

        const result = await getNewsByIds(postIds)
        return {
            success: result.success,
            // 這個清單本來就全是收藏，getNewsByIds 一律回 false，這裡補正
            data: result.data.map((item) => ({ ...item, favorite: true })),
        }
    } catch (error) {
        console.error('Failed to get favorite news:', error)
        return { success: false, data: [] }
    }
}
