'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toastBox } from '@/utils/toast'
import axios from 'axios'
import CommentForm from '@/components/molecules/CommentForm'
import CommentList from '@/components/organisms/CommentList'
import type { CommentType, CommentApiResponse } from '@/types/news'

interface CommentSectionProps {
    postId: string
    postTitle: string
}

const CommentSection = ({ postId, postTitle }: CommentSectionProps) => {
    const { status } = useSession()
    const isAuthenticated = status === 'authenticated'
    const [comments, setComments] = useState<CommentType[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchComments = useCallback(async () => {
        try {
            const res = await axios.get<CommentApiResponse>('/api/comment', {
                params: { postId },
            })
            if (res.data.success) {
                setComments(res.data.comments)
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

    const handleSubmit = async (content: string) => {
        try {
            const res = await axios.post<{ success: boolean; comment: CommentType }>(
                '/api/comment',
                { postId, postTitle, content }
            )

            if (res.data.success) {
                setComments((prev) => [res.data.comment, ...prev])
                toastBox('評論已送出', 'success')
            }
        } catch (error) {
            console.error('Failed to submit comment:', error)
            toastBox('評論失敗，請稍後再試', 'error')
        }
    }

    const handleDelete = async (commentId: string) => {
        try {
            const res = await axios.delete<{ success: boolean }>('/api/comment', {
                data: { commentId },
            })

            if (res.data.success) {
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
                <CommentForm onSubmit={handleSubmit} />
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
