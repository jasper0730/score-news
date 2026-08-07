'use client'

import { useCallback, useEffect, useState } from 'react'
import { toastBox } from '@/utils/toast'
import { getCommentsByUserId, deleteCommentAction } from '@/actions/commentActions'
import { getNewsByIds } from '@/actions/newsActions'
import type { CommentType, NewsDataType, RatingSummaryType } from '@/types/news'
import Loader from '@/components/atoms/Loader'
import NewsModal from '@/components/organisms/NewsModal'
import { CARD_CLASSES } from '@/libs/styles'
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

    /** 評分由 comment action 算好回傳，這裡只負責換掉畫面上的星等 */
    const handleRatingUpdate = (postId: string, rating: RatingSummaryType) => {
        const patch = { rate: rating.averageRating, userRate: rating.userRating }
        setAllNews((prev) => prev.map((n) => (n.article_id === postId ? { ...n, ...patch } : n)))
        setSelectedNews((prev) => (prev?.article_id === postId ? { ...prev, ...patch } : prev))
    }

    const handleDelete = async (commentId: string) => {
        const target = comments.find((c) => c._id === commentId)
        try {
            const result = await deleteCommentAction(commentId)

            if (result.success) {
                setComments((prev) => prev.filter((c) => c._id !== commentId))
                // 這裡刪掉的評論帶著評分，等一下點「查看文章」開的是同一份
                // allNews 資料，不同步的話星等會停在刪除前的數字
                if (target) handleRatingUpdate(target.postId, result.rating)
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
                <p className="p-10 text-center text-xl">目前沒有任何評論紀錄</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 py-6">
            {comments.map((comment) => (
                <div key={comment._id} className={CARD_CLASSES}>
                    <div className="mb-2 text-sm font-semibold text-primary">
                        📰 {comment.postTitle || '未知文章'}
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {comment.content}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-2">
                        <time className="text-xs text-subtle">
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
                                className="flex cursor-pointer items-center gap-1 text-xs text-primary transition duration-300 hover:opacity-70"
                                onClick={() => handleViewArticle(comment.postId)}
                            >
                                <FiEye />
                                <span>查看文章</span>
                            </button>
                            <button
                                className="cursor-pointer text-xs text-danger transition duration-300 hover:opacity-70"
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
