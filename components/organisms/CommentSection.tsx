'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toastBox } from '@/utils/toast'
import { getCommentsByPostId, createCommentAction, deleteCommentAction } from '@/actions/commentActions'
import CommentForm from '@/components/molecules/CommentForm'
import CommentList from '@/components/organisms/CommentList'
import type { CommentType } from '@/types/news'

interface CommentSectionProps {
    postId: string
    postTitle: string
    initialRating?: number
    onRatingUpdate?: (postId: string, newRating: number) => void
}

const CommentSection = ({ postId, postTitle, initialRating = 0, onRatingUpdate }: CommentSectionProps) => {
    const { data: session, status } = useSession()
    const isAuthenticated = status === 'authenticated'
    const currentUserId = (session?.user as { id?: string })?.id
    const [comments, setComments] = useState<CommentType[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchComments = useCallback(async () => {
        try {
            const result = await getCommentsByPostId(postId)
            if (result.success) {
                setComments(result.comments)
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error)
        } finally {
            setIsLoading(false)
        }
    }, [postId])

    useEffect(() => {
        if (postId) {
            fetchComments()
        }
    }, [postId, fetchComments])

    const userComment = useMemo(
        () => comments.find((c) => c.userId === currentUserId) ?? null,
        [comments, currentUserId]
    )

    const handleSubmit = async (content: string, rating: number) => {
        try {
            if (rating > 0) {
                onRatingUpdate?.(postId, rating)
            }

            const result = await createCommentAction(postId, postTitle, content, rating > 0 ? rating : undefined)

            if (result.success) {
                setComments((prev) => {
                    const idx = prev.findIndex(
                        (c) => c.userId === result.comment.userId || c._id === result.comment._id
                    )
                    if (idx >= 0) {
                        const updated = [...prev]
                        updated[idx] = result.comment
                        return updated
                    }
                    return [result.comment, ...prev]
                })
                toastBox(userComment ? '評論已更新' : '評論已送出', 'success')
            } else {
                toastBox('評論失敗，請稍後再試', 'error')
            }
        } catch (error) {
            console.error('Failed to submit comment:', error)
            toastBox('評論失敗，請稍後再試', 'error')
        }
    }

    const handleDelete = async (commentId: string) => {
        try {
            const result = await deleteCommentAction(commentId)

            if (result.success) {
                setComments((prev) => prev.filter((c) => c._id !== commentId))
                toastBox('評論已刪除', 'success')
            }
        } catch (error) {
            console.error('Failed to delete comment:', error)
            toastBox('刪除失敗，請稍後再試', 'error')
        }
    }

    return (
        <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">
                評論 ({comments.length})
            </h3>

            {isAuthenticated && (
                <CommentForm
                    key={userComment ? 'edit' : 'new'}
                    initialRating={userComment?.rating ?? initialRating}
                    initialContent={userComment?.content ?? ''}
                    onSubmit={handleSubmit}
                />
            )}

            {isLoading ? (
                <p className="text-gray-400 text-center py-4">載入評論中...</p>
            ) : (
                <CommentList comments={comments} onDelete={handleDelete} />
            )}
        </div>
    )
}

export default CommentSection
