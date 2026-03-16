'use server'

import { Sort } from 'mongodb'
import { getCollection, NewsDocument, FavoriteDocument, RatingDocument } from '@/libs/db'
import { NewsDataType } from '@/types/news'

export interface GetNewsParams {
    userId?: string | null
    query?: string
    sortType?: 'rating' | 'date'
    page?: number
    limit?: number
}

export type NewsResponse = {
    data: NewsDataType[]
    success: boolean
    message?: string
    hasMore: boolean
    total: number
}

export async function getNewsActions(params: GetNewsParams): Promise<NewsResponse> {
    const { userId, query = '', sortType = 'date', page = 1, limit = 8 } = params

    try {
        const newsCollection = await getCollection<NewsDocument>('news')
        const favoritesCollection = await getCollection<FavoriteDocument>('favorites')
        const ratingsCollection = await getCollection<RatingDocument>('ratings')

        // Build Query
        const filter: Record<string, unknown> = {}
        if (query) {
            filter.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        }

        // Output sorting
        let sortOption: Sort = {}
        if (sortType === 'date') {
            sortOption = { pubDate: -1 } // newest first
        } else if (sortType === 'rating') {
            // Because rating is dynamically calculated, doing this purely in Mongo with aggregation is best, 
            // but for a simple find, we can't sort by virtual fields easily unless we do an aggregation pipeline.
            // For now, if rating sort is requested, we will handle it via aggregation below.
        }

        // Pagination setup
        const skip = (page - 1) * limit
        
        let allData: Record<string, unknown>[] = []
        let total = 0

        if (sortType === 'rating') {
            // Aggregation pipeline to sort by average rating
            const pipeline = [
                { $match: filter },
                {
                    $lookup: {
                        from: 'ratings',
                        localField: 'article_id',
                        foreignField: 'postId',
                        as: 'ratingsData'
                    }
                },
                {
                    $addFields: {
                        avgRating: { $avg: '$ratingsData.rate' }
                    }
                },
                { $sort: { avgRating: -1, pubDate: -1 } },
                {
                    $facet: {
                        metadata: [{ $count: 'total' }],
                        data: [{ $skip: skip }, { $limit: limit }]
                    }
                }
            ]
            const aggResult = await newsCollection.aggregate(pipeline).toArray()
            allData = (aggResult[0].data as Record<string, unknown>[]) || []
            total = (aggResult[0].metadata as { total: number }[])[0]?.total || 0
        } else {
            total = await newsCollection.countDocuments(filter)
            allData = (await newsCollection
                .find(filter)
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .toArray()) as Record<string, unknown>[]
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
        const postIds = allData.map((item) => item.article_id as string)

        if (postIds.length > 0) {
            if (sortType !== 'rating') {
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
                userRatingMap = new Map(userRatings.map((r) => [r.postId as string, r.rate as number]))
            }
        }

        const enrichedData = allData.map((item) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _id, ...rest } = item
            const rate = sortType === 'rating'
                ? (item.avgRating as number)
                : ratingMap.get(item.article_id as string)
            return {
                ...rest,
                favorite: favoriteSet.has(item.article_id as string),
                rate: rate || 0,
                userRate: userRatingMap.get(item.article_id as string),
                views: (item.views as number) ?? 0,
            }
        }) as NewsDataType[]

        return {
            success: true,
            data: enrichedData,
            hasMore: total > skip + enrichedData.length,
            total
        }
    } catch (error) {
        console.error('Failed to get news:', error)
        return {
            success: false,
            data: [],
            message: error instanceof Error ? error.message : '發生未知錯誤',
            hasMore: false,
            total: 0
        }
    }
}

export async function getNewsByIds(articleIds: string[]): Promise<{ success: boolean; data: NewsDataType[] }> {
    try {
        if (articleIds.length === 0) return { success: true, data: [] }

        const newsCollection = await getCollection<NewsDocument>('news')
        const ratingsCollection = await getCollection<RatingDocument>('ratings')

        const docs = (await newsCollection
            .find({ article_id: { $in: articleIds } })
            .toArray()) as Record<string, unknown>[]

        const ratings = await ratingsCollection
            .aggregate([
                { $match: { postId: { $in: articleIds } } },
                { $group: { _id: '$postId', avgRating: { $avg: '$rate' } } },
            ])
            .toArray()

        const ratingMap = new Map(ratings.map((r) => [r._id as string, r.avgRating as number]))

        const data = docs.map((item) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _id, ...rest } = item
            return {
                ...rest,
                favorite: false,
                rate: ratingMap.get(item.article_id as string) || 0,
            }
        }) as NewsDataType[]

        return { success: true, data }
    } catch (error) {
        console.error('Failed to get news by ids:', error)
        return { success: false, data: [] }
    }
}
