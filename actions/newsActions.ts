'use server'

import type { Sort, WithId } from 'mongodb'
import {
    getCollection,
    type NewsDocument,
    type FavoriteDocument,
    type RatingDocument,
    type LikeDocument,
} from '@/libs/db'
import type { NewsDataType, SortType } from '@/types/news'
import { getSession } from '@/actions/getUser'

/** 依評分排序時走 aggregate，結果會多帶一個算出來的 avgRating 欄位 */
type NewsQueryDocument = WithId<NewsDocument> & { avgRating?: number }

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

/**
 * 這些排序依據都不是新聞文件上的欄位，得先 $lookup 其他 collection 算出來，
 * 因此無法用一般索引排序，只能走 aggregate。
 */
const AGGREGATED_SORTS = ['rating_desc', 'rating_asc', 'favorites', 'likes'] as const
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
    date_asc: { pubDate: 1 },
    views: { views: -1, pubDate: -1 },
}

/**
 * 算出排序依據的欄位，以及要 $lookup 哪個 collection。
 *
 * 收藏的結構是「一位使用者一份文件、postIds 陣列」，所以比對條件是
 * 「該文件的 postIds 包含這篇的 article_id」，與按讚／評分的 localField
 * 對 foreignField 不同，得用 pipeline 形式的 $lookup。
 */
const AGGREGATE_STAGES: Record<
    AggregatedSort,
    { lookup: Record<string, unknown>; field: Record<string, unknown>; direction: 1 | -1 }
> = {
    rating_desc: {
        lookup: {
            from: 'ratings',
            localField: 'article_id',
            foreignField: 'postId',
            as: 'sortSource',
        },
        field: { $avg: '$sortSource.rate' },
        direction: -1,
    },
    rating_asc: {
        lookup: {
            from: 'ratings',
            localField: 'article_id',
            foreignField: 'postId',
            as: 'sortSource',
        },
        field: { $avg: '$sortSource.rate' },
        direction: 1,
    },
    likes: {
        lookup: {
            from: 'likes',
            localField: 'article_id',
            foreignField: 'postId',
            as: 'sortSource',
        },
        field: { $size: '$sortSource' },
        direction: -1,
    },
    favorites: {
        lookup: {
            from: 'favorites',
            let: { articleId: '$article_id' },
            pipeline: [
                { $match: { $expr: { $in: ['$$articleId', { $ifNull: ['$postIds', []] }] } } },
            ],
            as: 'sortSource',
        },
        field: { $size: '$sortSource' },
        direction: -1,
    },
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
        const ratingsCollection = await getCollection<RatingDocument>('ratings')
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
        // 依評分排序時 pipeline 已經算出平均，enrich 階段不必再查一次
        const byRating = sortType === 'rating_desc' || sortType === 'rating_asc'

        let allData: NewsQueryDocument[] = []
        let total = 0

        if (byAggregate) {
            const stage = AGGREGATE_STAGES[sortType]
            const pipeline = [
                { $match: filter },
                { $lookup: stage.lookup },
                { $addFields: { sortValue: stage.field, avgRating: { $avg: '$sortSource.rate' } } },
                // 次要條件用 pubDate，否則同分的文章在不同頁之間順序不穩定，
                // 無限捲動會出現重複或漏掉的項目
                { $sort: { sortValue: stage.direction, pubDate: -1 } },
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
        const postIds = allData.map((item) => item.article_id)

        if (postIds.length > 0) {
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

            if (!byRating) {
                const avgRatings = await ratingsCollection
                    .aggregate([
                        { $match: { postId: { $in: postIds } } },
                        { $group: { _id: '$postId', avgRating: { $avg: '$rate' } } },
                    ])
                    .toArray()
                ratingMap = new Map(avgRatings.map((r) => [r._id as string, r.avgRating as number]))
            }

            if (userId) {
                const userRatings = await ratingsCollection
                    .find({ userId, postId: { $in: postIds } })
                    .toArray()
                userRatingMap = new Map(
                    userRatings.map((r) => [r.postId as string, r.rate as number])
                )
            }
        }

        const enrichedData: NewsDataType[] = allData.map((item) =>
            toNewsData(item, {
                rate: (byRating ? item.avgRating : ratingMap.get(item.article_id)) ?? 0,
                favorite: favoriteSet.has(item.article_id),
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
        const ratingsCollection = await getCollection<RatingDocument>('ratings')
        const likesCollection = await getCollection<LikeDocument>('likes')

        const docs = await newsCollection.find({ article_id: { $in: articleIds } }).toArray()

        const ratings = await ratingsCollection
            .aggregate([
                { $match: { postId: { $in: articleIds } } },
                { $group: { _id: '$postId', avgRating: { $avg: '$rate' } } },
            ])
            .toArray()

        const ratingMap = new Map(ratings.map((r) => [r._id as string, r.avgRating as number]))

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
