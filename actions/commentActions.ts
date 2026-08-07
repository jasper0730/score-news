'use server'

import { ObjectId } from 'mongodb'
import { requireAuth, requireAuthWithRole } from '@/libs/auth'
import { getCollection, CommentDocument, CommentEditHistoryDocument, UserDocument } from '@/libs/db'
import type { CommentType } from '@/types/news'

/**
 * 轉成前端型別。
 *
 * 管理員下架的評論只留下墓碑：內容與評分一律清空，不讓原始內容
 * 透過 RSC payload 送到瀏覽器——下架的意思是「誰都不該再看到」，
 * 不是「畫面上不顯示但原始碼裡讀得到」。
 */
function serializeComment(c: CommentDocument & { _id?: ObjectId }): CommentType {
    const isRemovedByAdmin = Boolean(c.deletedAt && c.deletedByAdmin)

    return {
        _id: c._id!.toString(),
        userId: c.userId,
        userName: c.userName,
        userImage: c.userImage,
        postId: c.postId,
        postTitle: c.postTitle,
        content: isRemovedByAdmin ? '' : c.content,
        rating: isRemovedByAdmin ? undefined : c.rating,
        createdAt: c.createdAt,
        editedAt: isRemovedByAdmin ? undefined : c.editedAt,
        ...(isRemovedByAdmin ? { isRemovedByAdmin: true } : {}),
    }
}

/**
 * 只排除「本人自刪」的評論。
 *
 * 管理員下架的要留著，前端會顯示「因違反社群規範已被隱藏」——
 * 留言區突然少一則但編號對不上，比留一個墓碑更讓人困惑。
 */
const VISIBLE_FILTER = {
    $or: [{ deletedAt: { $exists: false } }, { deletedByAdmin: true }],
}

export async function getCommentsByPostId(postId: string) {
    try {
        const commentsCollection = await getCollection<CommentDocument>('comments')
        const comments = await commentsCollection
            .find({ postId, ...VISIBLE_FILTER })
            .sort({ createdAt: -1 })
            .toArray()

        return { success: true as const, comments: comments.map(serializeComment) }
    } catch (error) {
        console.error('Error in getCommentsByPostId:', error)
        return { success: false as const, comments: [], error: 'Internal server error' }
    }
}

export async function getCommentsByUserId(userId: string) {
    try {
        const commentsCollection = await getCollection<CommentDocument>('comments')
        const comments = await commentsCollection
            .find({ userId, ...VISIBLE_FILTER })
            .sort({ createdAt: -1 })
            .toArray()

        return { success: true as const, comments: comments.map(serializeComment) }
    } catch (error) {
        console.error('Error in getCommentsByUserId:', error)
        return { success: false as const, comments: [], error: 'Internal server error' }
    }
}

export async function createCommentAction(
    postId: string,
    postTitle: string,
    content: string,
    rating?: number
) {
    try {
        const auth = await requireAuth()
        if (!auth.authenticated) {
            return { success: false as const, error: auth.error }
        }

        const currentUser = auth.user

        if (!postId || (!content?.trim() && !rating)) {
            return { success: false as const, error: 'postId and content or rating are required' }
        }

        const commentsCollection = await getCollection<CommentDocument>('comments')
        const usersCollection = await getCollection<UserDocument>('users')

        const existing = await commentsCollection.findOne({ userId: currentUser.id, postId })

        // 被管理員下架的評論不能靠再送一次蓋掉，否則審核等於白做。
        // 本人自刪的則允許重新發表，那是他自己的決定。
        if (existing?.deletedAt && existing.deletedByAdmin) {
            return {
                success: false as const,
                error: '這則評論已被管理員下架，無法重新發表',
            }
        }

        const userDoc = await usersCollection.findOne({
            _id: new ObjectId(currentUser.id),
        })
        const displayName = userDoc?.nickname || currentUser.name || currentUser.email || '匿名用戶'

        const now = new Date().toISOString()
        const nextContent = content?.trim() ?? ''
        const nextRating = rating != null ? rating : existing?.rating

        // 內容或評分真的變了才算編輯。同樣的東西再送一次不該留下歷史，
        // 也不該讓畫面上多一個「已編輯」標記。
        const isEdit =
            Boolean(existing) &&
            !existing?.deletedAt &&
            (existing?.content !== nextContent || existing?.rating !== nextRating)

        if (isEdit && existing?._id) {
            const history = await getCollection<CommentEditHistoryDocument>('comment_edits_history')
            await history.insertOne({
                commentId: existing._id,
                userId: existing.userId,
                postId: existing.postId,
                content: existing.content,
                rating: existing.rating,
                replacedAt: now,
            })
        }

        const result = await commentsCollection.findOneAndUpdate(
            { userId: currentUser.id, postId },
            {
                $set: {
                    userName: displayName,
                    userImage: currentUser.image ?? '',
                    postTitle: postTitle ?? '',
                    content: nextContent,
                    ...(rating != null ? { rating } : {}),
                    ...(isEdit ? { editedAt: now } : {}),
                },
                $setOnInsert: { createdAt: now },
                // 本人自刪後重新發表：清掉刪除標記讓它重新出現
                ...(existing?.deletedAt
                    ? { $unset: { deletedAt: '', deletedBy: '', deletedByAdmin: '' } }
                    : {}),
            },
            { upsert: true, returnDocument: 'after' }
        )

        if (!result) {
            return { success: false as const, error: 'Failed to save comment' }
        }

        return {
            success: true as const,
            comment: serializeComment(result as CommentDocument & { _id: ObjectId }),
        }
    } catch (error) {
        console.error('Error in createCommentAction:', error)
        return { success: false as const, error: 'Internal server error' }
    }
}

export async function deleteCommentAction(commentId: string) {
    try {
        const auth = await requireAuthWithRole()
        if (!auth.authenticated) {
            return { success: false as const, error: auth.error }
        }

        if (!commentId) {
            return { success: false as const, error: 'commentId is required' }
        }

        const commentsCollection = await getCollection<CommentDocument>('comments')

        // 一般使用者的條件必須綁 userId——不能「先查出來、比對擁有者、再刪」，
        // 那中間有時間差，也多一次查詢。管理員則不受這個條件限制。
        //
        // 這個判斷一定要在伺服器端做：前端不顯示按鈕只是介面，
        // server action 是公開端點，任何人都能帶任意 commentId 呼叫。
        const filter = auth.isAdmin
            ? { _id: new ObjectId(commentId) }
            : { _id: new ObjectId(commentId), userId: auth.user.id }

        // 軟刪除而非真的刪除：留下審核軌跡，也保住評分與留言的關聯。
        // deletedByAdmin 記錄的是「刪別人的」，管理員刪自己的仍算自刪。
        const existing = await commentsCollection.findOne(filter)
        if (!existing) {
            return { success: false as const, error: 'Comment not found or unauthorized' }
        }
        if (existing.deletedAt) {
            return { success: false as const, error: 'Comment already deleted' }
        }

        await commentsCollection.updateOne(filter, {
            $set: {
                deletedAt: new Date().toISOString(),
                deletedBy: auth.user.id,
                deletedByAdmin: auth.isAdmin && existing.userId !== auth.user.id,
            },
        })

        return { success: true as const, message: 'Comment deleted' }
    } catch (error) {
        console.error('Error in deleteCommentAction:', error)
        return { success: false as const, error: 'Internal server error' }
    }
}
