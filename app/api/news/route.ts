import { NextResponse } from 'next/server'
import { newsData } from '@/libs/datas/newsData'
import clientPromise from '@/libs/mongodb'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    try {
        const client = await clientPromise
        const db = client.db()
        const favoritesCollection = db.collection('favorites')
        const ratingsCollection = db.collection('ratings')

        const allData = newsData.results

        let favoriteSet = new Set()
        if (userId) {
            const userFavorites = await favoritesCollection.findOne({ userId })
            if (userFavorites?.postIds) {
                favoriteSet = new Set(userFavorites.postIds)
            }
        }

        const postIds = allData.map((item) => item.article_id)
        const ratings = await ratingsCollection
            .aggregate([
                { $match: { postId: { $in: postIds } } },
                {
                    $group: {
                        _id: '$postId',
                        avgRating: { $avg: '$rate' },
                    },
                },
            ])
            .toArray()

        const ratingMap = new Map(ratings.map((r) => [r._id, r.avgRating]))
        const enrichedData = allData.map((item) => ({
            ...item,
            favorite: favoriteSet.has(item.article_id),
            rate: ratingMap.get(item.article_id),
        }))

        return NextResponse.json(
            {
                success: true,
                data: enrichedData,
            },
            { status: 200 }
        )
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : '發生未知錯誤',
            },
            { status: 500 }
        )
    }
}
