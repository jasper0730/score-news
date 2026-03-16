'use server'

import { requireAuth } from '@/libs/auth'
import { getCollection, RatingDocument } from '@/libs/db'

export async function rateNewsAction(postId: string, rate: number) {
    const auth = await requireAuth()
    if (!auth.authenticated) {
        return { success: false as const, error: auth.error, rate: 0 }
    }

    try {
        const { id: userId } = auth.user

        if (!postId) {
            return { success: false as const, error: 'Post ID is required', rate: 0 }
        }

        const ratingsCollection = await getCollection<RatingDocument>('ratings')

        const existingRating = await ratingsCollection.findOne({ userId, postId })
        if (existingRating) {
            await ratingsCollection.updateOne({ userId, postId }, { $set: { rate } })
        } else {
            await ratingsCollection.insertOne({ userId, postId, rate })
        }

        const ratings = await ratingsCollection
            .aggregate([
                { $match: { postId } },
                {
                    $group: {
                        _id: postId,
                        avgRating: { $avg: '$rate' },
                    },
                },
            ])
            .toArray()

        const avgRating = ratings.length > 0 ? ratings[0].avgRating : rate

        return {
            success: true as const,
            rate: avgRating,
        }
    } catch (error) {
        console.error('Error in rateNewsAction:', error)
        return { success: false as const, error: 'Internal server error', rate: 0 }
    }
}
