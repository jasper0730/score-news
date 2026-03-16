'use client'

import { useCallback, useEffect, useState } from 'react'
import { toastBox } from '@/utils/toast'
import { getCommentsByUserId, deleteCommentAction } from '@/actions/commentActions'
import { getNewsByIds } from '@/actions/newsActions'
import type { CommentType, NewsDataType } from '@/types/news'
import Loader from '@/components/atoms/Loader'
import NewsModal from '@/components/organisms/NewsModal'
import { rateNewsAction } from '@/actions/rateNewsAction'
import { FiEye } from 'react-icons/fi'

interface DashboardCommentListProps {
    userId: string
}

const DashboardCommentList = ({ userId }: DashboardCommentListProps) => {
    const [comments, setComments] = useState<CommentType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [allNews, setAllNews] = useState<NewsDataType[]>([])
    const [selectedNews, setSelectedNews] = useState<NewsDataType | null>(null)

    const fetchComments = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await getCommentsByUserId(userId)
            if (result.success) {
                setComments(result.comments)
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error)
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    const fetchNews = useCallback(async (commentList: CommentType[]) => {
        try {
            const articleIds = [...new Set(commentList.map((c) => c.postId))]
            if (articleIds.length === 0) return
            const result = await getNewsByIds(articleIds)
            if (result.success) {
                setAllNews(result.data)
            }
        } catch (error) {
            console.error('Failed to fetch news:', error)
        }
    }, [])

    useEffect(() => {
        fetchComments().then(() => {})
    }, [fetchComments])

    useEffect(() => {
        if (comments.length > 0) {
            fetchNews(comments)
        }
    }, [comments, fetchNews])

    const handleViewArticle = (postId: string) => {
        const article = allNews.find((n) => n.article_id === postId)
        if (article) {
            setSelectedNews(article)
        } else {
            toastBox('找不到該文章', 'error')
        }
    }

    const handleRatingUpdate = async (postId: string, newRating: number) => {
        try {
            const result = await rateNewsAction(postId, newRating)

            if (result.success) {
                const updatedRating = result.rate

                setAllNews((prev) =>
                    prev.map((n) =>
                        n.article_id === postId ? { ...n, rate: updatedRating } : n
                    )
                )

                if (selectedNews?.article_id === postId) {
                    setSelectedNews((prev) =>
                        prev ? { ...prev, rate: updatedRating } : null
                    )
                }
            }
        } catch (error) {
            console.error('Failed to update rating:', error)
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

    if (isLoading) return <Loader />

    if (comments.length === 0) {
        return (
            <div className="p-10">
                <p className="text-center text-xl p-10">目前沒有任何評論紀錄</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 py-6">
            {comments.map((comment) => (
                <div key={comment._id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                        📰 {comment.postTitle || '未知文章'}
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <time className="text-xs text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString('zh-TW', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </time>
                        <div className="flex items-center gap-3">
                            <button
                                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 cursor-pointer duration-300"
                                onClick={() => handleViewArticle(comment.postId)}
                                aria-label="查看文章"
                            >
                                <FiEye />
                                <span>查看文章</span>
                            </button>
                            <button
                                className="text-xs text-red-400 hover:text-red-600 cursor-pointer duration-300"
                                onClick={() => handleDelete(comment._id)}
                                aria-label="刪除評論"
                            >
                                刪除
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            <NewsModal
                data={selectedNews}
                onClose={() => setSelectedNews(null)}
                onRatingUpdate={handleRatingUpdate}
                open={selectedNews !== null}
            />
        </div>
    )
}

export default DashboardCommentList
