'use server'

import { ObjectId } from 'mongodb'
import { requireAuth } from '@/libs/auth'
import { getCollection, CommentDocument, UserDocument } from '@/libs/db'
import type { CommentType } from '@/types/news'

function serializeComment(c: CommentDocument & { _id?: ObjectId }): CommentType {
    return {
        _id: c._id!.toString(),
        userId: c.userId,
        userName: c.userName,
        userImage: c.userImage,
        postId: c.postId,
        postTitle: c.postTitle,
        content: c.content,
        rating: c.rating,
        createdAt: c.createdAt,
    }
}

export async function getCommentsByPostId(postId: string) {
    try {
        const commentsCollection = await getCollection<CommentDocument>('comments')
        const comments = await commentsCollection
            .find({ postId })
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
            .find({ userId })
            .sort({ createdAt: -1 })
            .toArray()

        return { success: true as const, comments: comments.map(serializeComment) }
    } catch (error) {
        console.error('Error in getCommentsByUserId:', error)
        return { success: false as const, comments: [], error: 'Internal server error' }
    }
}

export async function createCommentAction(postId: string, postTitle: string, content: string, rating?: number) {
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

        const userDoc = await usersCollection.findOne({
            _id: new ObjectId(currentUser.id) as unknown as UserDocument['_id'],
        })
        const displayName =
            userDoc?.nickname || currentUser.name || currentUser.email || '匿名用戶'

        const now = new Date().toISOString()

        const result = await commentsCollection.findOneAndUpdate(
            { userId: currentUser.id, postId },
            {
                $set: {
                    userName: displayName,
                    userImage: currentUser.image ?? '',
                    postTitle: postTitle ?? '',
                    content: content?.trim() ?? '',
                    ...(rating != null ? { rating } : {}),
                },
                $setOnInsert: { createdAt: now },
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
        const auth = await requireAuth()
        if (!auth.authenticated) {
            return { success: false as const, error: auth.error }
        }

        const currentUser = auth.user

        if (!commentId) {
            return { success: false as const, error: 'commentId is required' }
        }

        const commentsCollection = await getCollection<CommentDocument>('comments')

        const result = await commentsCollection.deleteOne({
            _id: new ObjectId(commentId) as unknown as CommentDocument['_id'],
            userId: currentUser.id,
        })

        if (result.deletedCount === 0) {
            return { success: false as const, error: 'Comment not found or unauthorized' }
        }

        return { success: true as const, message: 'Comment deleted' }
    } catch (error) {
        console.error('Error in deleteCommentAction:', error)
        return { success: false as const, error: 'Internal server error' }
    }
}
