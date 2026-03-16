'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toastBox } from '@/utils/toast'
import { getNewsActions } from '@/actions/newsActions'
import { toggleFavoriteAction } from '@/actions/favoriteActions'
import { rateNewsAction } from '@/actions/rateNewsAction'
import type { NewsDataType } from '@/types/news'
import Loader from '@/components/atoms/Loader'
import NewsCard from '@/components/organisms/NewsCard'
import NewsModal from '@/components/organisms/NewsModal'

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
            const result = await getNewsActions({ userId: user.id, limit: 1000 })
            const fetchedNews = result.data ?? []
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
            const result = await rateNewsAction(postId, newRating)

            if (result.success) {
                const updatedRating = result.rate

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
            const result = await toggleFavoriteAction(id)

            if (!result.success) {
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
            <div className="p-10">
                <p className="text-center text-xl p-10">
                    目前沒有收藏的新聞，請回
                    <Link href="/" className="text-red-500 hover:opacity-70">
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
