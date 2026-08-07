'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toastBox } from '@/utils/toast'
import {
    getCommentsByPostId,
    createCommentAction,
    deleteCommentAction,
} from '@/actions/commentActions'
import CommentForm from '@/components/molecules/CommentForm'
import CommentList from '@/components/organisms/CommentList'
import type { CommentType } from '@/types/news'

interface CommentSectionProps {
    postId: string
    postTitle: string
    initialRating?: number
    onRatingUpdate?: (postId: string, newRating: number) => void
}

const CommentSection = ({
    postId,
    postTitle,
    initialRating = 0,
    onRatingUpdate,
}: CommentSectionProps) => {
    const { data: session, status } = useSession()
    const isAuthenticated = status === 'authenticated'
    const currentUserId = session?.user?.id
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

    const ownComment = useMemo(
        () => comments.find((c) => c.userId === currentUserId) ?? null,
        [comments, currentUserId]
    )
    // 自己的評論被管理員下架時不給重新發表——server action 也會擋，
    // 但讓表單直接消失比送出後才被拒絕清楚得多
    const isOwnRemoved = ownComment?.isRemovedByAdmin === true
    const userComment = isOwnRemoved ? null : ownComment

    const handleSubmit = async (content: string, rating: number) => {
        try {
            if (rating > 0) {
                onRatingUpdate?.(postId, rating)
            }

            const result = await createCommentAction(
                postId,
                postTitle,
                content,
                rating > 0 ? rating : undefined
            )

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
            if (!result.success) {
                toastBox(result.error ?? '刪除失敗，請稍後再試', 'error')
                return
            }

            // 重新取一次而不是在本地移除：軟刪除後這則可能消失（本人自刪）
            // 也可能變成墓碑（管理員下架），由伺服器決定比在前端猜可靠
            await fetchComments()
            toastBox('評論已刪除', 'success')
        } catch (error) {
            console.error('Failed to delete comment:', error)
            toastBox('刪除失敗，請稍後再試', 'error')
        }
    }

    return (
        <div className="mt-8 border-t pt-6">
            <h3 className="mb-4 text-lg font-semibold">評論 ({comments.length})</h3>

            {isAuthenticated && isOwnRemoved && (
                <p className="mt-4 rounded-lg border border-input p-3 text-sm text-subtle">
                    你的評論因違反社群規範已被管理員隱藏，無法重新發表。
                </p>
            )}

            {isAuthenticated && !isOwnRemoved && (
                <CommentForm
                    key={userComment ? 'edit' : 'new'}
                    initialRating={userComment?.rating ?? initialRating}
                    initialContent={userComment?.content ?? ''}
                    onSubmit={handleSubmit}
                />
            )}

            {isLoading ? (
                <p className="py-4 text-center text-subtle">載入評論中...</p>
            ) : (
                <CommentList comments={comments} onDelete={handleDelete} />
            )}
        </div>
    )
}

export default CommentSection
