'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toastBox } from '@/utils/toast'
import { getFavoriteNewsAction } from '@/actions/newsActions'
import { toggleFavoriteAction } from '@/actions/favoriteActions'
import { toggleLikeAction } from '@/actions/likeActions'
import { rateNewsAction } from '@/actions/rateNewsAction'
import { shareArticle } from '@/libs/share'
import type { NewsDataType } from '@/types/news'
import Loader from '@/components/atoms/Loader'
import NewsCard from '@/components/organisms/NewsCard'
import NewsModal from '@/components/organisms/NewsModal'
import { NEWS_GRID_CLASSES } from '@/libs/styles'

interface DashboardNewsListProps {
    user: { id: string } | null
}

const DashboardNewsList = ({ user }: DashboardNewsListProps) => {
    const [selectedNews, setSelectedNews] = useState<NewsDataType | null>(null)
    const [newsData, setNewsData] = useState<NewsDataType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [hasFetched, setHasFetched] = useState(false)

    const fetchData = useCallback(async () => {
        if (!user) return

        setIsLoading(true)
        try {
            const result = await getFavoriteNewsAction()
            const fetchedNews = result.data ?? []
            setNewsData(fetchedNews)
            setHasFetched(true)
        } catch (error) {
            console.error(error instanceof Error ? error.message : error)
        } finally {
            setIsLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleRatingUpdate = async (postId: string, newRating: number) => {
        try {
            const result = await rateNewsAction(postId, newRating)

            if (result.success) {
                const updatedRating = result.rate

                setNewsData((prevData) =>
                    prevData.map((news) =>
                        news.article_id === postId ? { ...news, rate: updatedRating } : news
                    )
                )

                if (selectedNews?.article_id === postId) {
                    setSelectedNews((prev) => (prev ? { ...prev, rate: updatedRating } : null))
                }
            }
        } catch (error) {
            console.error('Failed to update rating:', error)
        }
    }

    const handleLikeClick = async (id: string) => {
        const previous = newsData.find((n) => n.article_id === id)
        if (!previous) return

        const applyLike = (patch: { liked: boolean; likes: number }) =>
            setNewsData((prev) => prev.map((n) => (n.article_id === id ? { ...n, ...patch } : n)))

        applyLike({
            liked: !previous.liked,
            likes: previous.likes + (previous.liked ? -1 : 1),
        })
        try {
            const result = await toggleLikeAction(id)
            if (!result.success) throw new Error(result.error)
            applyLike({ liked: result.liked, likes: result.likes })
        } catch (error) {
            console.error('Failed to toggle like:', error)
            applyLike({ liked: previous.liked, likes: previous.likes })
            toastBox('操作失敗，請稍後再試', 'error')
        }
    }

    const handleShareClick = async (article: NewsDataType) => {
        const result = await shareArticle(article)
        if (result === 'copied') toastBox('連結已複製', 'success')
        if (result === 'failed') toastBox('分享失敗', 'error')
    }

    const handleFavoriteClick = async (id: string) => {
        try {
            const result = await toggleFavoriteAction(id)

            if (!result.success) {
                throw new Error(result.error)
            }

            setNewsData((prev) => prev.filter((item) => item.article_id !== id))
            toastBox('移除收藏', 'success')
        } catch (error) {
            console.error('Failed to update favorite:', error)
        }
    }

    if (isLoading && !hasFetched) return <Loader />

    if (!isLoading && newsData.length === 0) {
        return (
            <div className="p-10">
                <p className="p-10 text-center text-xl">
                    目前沒有收藏的新聞，請回
                    <Link href="/" className="text-danger hover:opacity-70">
                        首頁
                    </Link>
                    加入收藏文章
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="min-h-screen px-4 py-10">
                <div className={NEWS_GRID_CLASSES}>
                    {newsData.map((article) => (
                        <NewsCard
                            key={article.article_id}
                            article={article}
                            favorite
                            onFavoriteClick={handleFavoriteClick}
                            onLikeClick={handleLikeClick}
                            onShareClick={handleShareClick}
                            onMoreClick={() => setSelectedNews(article)}
                        />
                    ))}
                </div>
            </div>
            <NewsModal
                data={selectedNews}
                onClose={() => setSelectedNews(null)}
                onRatingUpdate={handleRatingUpdate}
                open={selectedNews !== null}
            />
        </>
    )
}

export default DashboardNewsList
