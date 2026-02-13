'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toastBox } from '@/utils/toast'
import axios from 'axios'
import type { NewsDataType, NewsApiResponse } from '@/types/news'
import Loader from '@/components/atoms/Loader'
import NewsCard from '@/components/organisms/NewsCard'
import NewsModal from '@/components/organisms/NewsModal'

interface DashboardNewsListProps {
    user: { id: string } | null
}

interface RatingApiResponse {
    state: string
    rate: number
}

interface FavoriteApiResponse {
    success: boolean
    message: string
}

const DashboardNewsList = ({ user }: DashboardNewsListProps) => {
    const router = useRouter()
    const [selectedNews, setSelectedNews] = useState<NewsDataType | null>(null)
    const [newsData, setNewsData] = useState<NewsDataType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [hasFetched, setHasFetched] = useState(false)

    useEffect(() => {
        if (!user) {
            router.push('/login')
        }
    }, [user, router])

    const fetchData = useCallback(async () => {
        if (!user) return

        setIsLoading(true)
        try {
            const res = await axios.get<NewsApiResponse>('/api/news', {
                params: { userId: user.id },
            })

            const fetchedNews = res.data.data ?? []
            setNewsData(fetchedNews.filter((item) => item.favorite))
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
            const response = await axios.post<RatingApiResponse>('/api/rating', {
                id: postId,
                rate: newRating,
            })

            if (response.data.state === 'success') {
                const updatedRating = response.data.rate

                setNewsData((prevData) =>
                    prevData.map((news) =>
                        news.article_id === postId
                            ? { ...news, rate: updatedRating }
                            : news
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

    const handleFavoriteClick = async (id: string) => {
        try {
            const res = await axios.post<FavoriteApiResponse>('/api/favorite', { id })

            if (!res.data.success) {
                throw new Error('Failed to update favorite')
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
            <div className="dashboard__empty">
                <p className="dashboard__empty-text">
                    目前沒有收藏的新聞，請回
                    <Link href="/" className="dashboard__empty-link">
                        首頁
                    </Link>
                    加入收藏文章
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="news-list">
                <div className="news-list__grid">
                    {newsData.map((article) => (
                        <NewsCard
                            key={article.article_id}
                            article={article}
                            favorite
                            onFavoriteClick={handleFavoriteClick}
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
