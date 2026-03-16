'use server'

import { requireAuth } from '@/libs/auth'
import { getCollection, FavoriteDocument } from '@/libs/db'

export async function toggleFavoriteAction(postId: string) {
    try {
        const auth = await requireAuth()
        if (!auth.authenticated) {
            return { success: false, error: auth.error }
        }

        const { id: userId } = auth.user

        if (!postId) {
            return { success: false, error: 'Post ID is required' }
        }

        const favoritesCollection = await getCollection<FavoriteDocument>('favorites')

        const userFavorites = await favoritesCollection.findOne({ userId })

        let message = ''
        if (userFavorites && userFavorites.postIds.includes(postId)) {
            await favoritesCollection.updateOne({ userId }, { $pull: { postIds: postId } })
            message = 'Favorite removed'
        } else {
            await favoritesCollection.updateOne(
                { userId },
                { $addToSet: { postIds: postId } },
                { upsert: true }
            )
            message = 'Favorite added'
        }

        return { success: true, message }
    } catch (error) {
        console.error('Error in toggleFavoriteAction:', error)
        return { success: false, error: 'Internal server error' }
    }
}
