'use server'

import { requireAuth } from '@/libs/auth'
import { getCollection, FavoriteDocument } from '@/libs/db'

/**
 * 切換收藏狀態，回傳切換後的狀態與該篇的最新收藏總數。
 *
 * 回傳總數而不是讓前端自行加減：同一篇文章可能同時有其他人在收藏，
 * 前端自己算會越來越偏離真實值。
 */
export async function toggleFavoriteAction(postId: string) {
    try {
        const auth = await requireAuth()
        if (!auth.authenticated) {
            return { success: false as const, error: auth.error }
        }

        const { id: userId } = auth.user

        if (!postId) {
            return { success: false as const, error: 'Post ID is required' }
        }

        const favoritesCollection = await getCollection<FavoriteDocument>('favorites')

        const userFavorites = await favoritesCollection.findOne({ userId })
        const favorited = !userFavorites?.postIds?.includes(postId)

        if (favorited) {
            await favoritesCollection.updateOne(
                { userId },
                { $addToSet: { postIds: postId } },
                { upsert: true }
            )
        } else {
            await favoritesCollection.updateOne({ userId }, { $pull: { postIds: postId } })
        }

        // 收藏是「一位使用者一份文件、postIds 陣列」的結構，
        // 所以某篇的收藏數 = 有幾份文件的 postIds 含有它
        const favorites = await favoritesCollection.countDocuments({ postIds: postId })

        return { success: true as const, favorited, favorites }
    } catch (error) {
        console.error('Error in toggleFavoriteAction:', error)
        return { success: false as const, error: 'Internal server error' }
    }
}
