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

/** 依評分排序必須走 aggregate，因為 avgRating 是算出來的欄位，無法用一般索引排序 */
const usesRatingSort = (sortType: SortType) => sortType.startsWith('rating')

const SORT_OPTIONS: Record<Exclude<SortType, 'rating_desc' | 'rating_asc'>, Sort> = {
    date_desc: { pubDate: -1 },
    date_asc: { pubDate: 1 },
    views: { views: -1 },
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
        const byRating = usesRatingSort(sortType)

        let allData: NewsQueryDocument[] = []
        let total = 0

        if (byRating) {
            // Aggregation pipeline to sort by average rating
            const pipeline = [
                { $match: filter },
                {
                    $lookup: {
                        from: 'ratings',
                        localField: 'article_id',
                        foreignField: 'postId',
                        as: 'ratingsData',
                    },
                },
                {
                    $addFields: {
                        avgRating: { $avg: '$ratingsData.rate' },
                    },
                },
                { $sort: { avgRating: sortType === 'rating_asc' ? 1 : -1, pubDate: -1 } },
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
                // byRating 為 false 已排除兩個 rating 選項，但 TS 無法從布林值收窄
                // sortType，因此在這裡明確斷言剩餘的聯集
                .sort(SORT_OPTIONS[sortType as keyof typeof SORT_OPTIONS])
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
