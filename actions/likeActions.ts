'use server'

import { requireAuth } from '@/libs/auth'
import { getCollection, LikeDocument } from '@/libs/db'

/**
 * 切換按讚狀態，回傳切換後的狀態與該篇的最新總數。
 *
 * 回傳總數而不是讓前端自行加減：同一篇文章可能同時有其他人在按，
 * 前端自己算會越來越偏離真實值。
 */
export async function toggleLikeAction(postId: string) {
    try {
        const auth = await requireAuth()
        if (!auth.authenticated) {
            return { success: false as const, error: auth.error }
        }

        const { id: userId } = auth.user

        if (!postId) {
            return { success: false as const, error: 'Post ID is required' }
        }

        const likes = await getCollection<LikeDocument>('likes')

        // 直接用刪除的結果判斷原本有沒有按過，省掉一次查詢。
        // userId + postId 有唯一索引，併發下也不會重複計數。
        const removed = await likes.deleteOne({ userId, postId })
        const liked = removed.deletedCount === 0
        if (liked) {
            await likes.insertOne({ userId, postId })
        }

        const count = await likes.countDocuments({ postId })

        return { success: true as const, liked, likes: count }
    } catch (error) {
        console.error('Error in toggleLikeAction:', error)
        return { success: false as const, error: 'Internal server error' }
    }
}
