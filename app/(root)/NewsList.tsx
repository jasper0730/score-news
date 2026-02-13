'use client'

import { useEffect, useMemo, useState } from 'react'
import { useNewsStore } from '@/store/newsStore'
import { useShallow } from 'zustand/shallow'
import { toastBox } from '@/utils/toast'
import type { NewsDataType, NewsApiResponse } from '@/types/news'
import axios from 'axios'
import NewsCard from '@/components/organisms/NewsCard'
import NewsModal from '@/components/organisms/NewsModal'

interface NewsListProps {
    data: NewsApiResponse
}

interface FavoriteApiResponse {
    success: boolean
    message: string
}

interface RatingApiResponse {
    state: string
    rate: number
}

const NewsList = ({ data }: NewsListProps) => {
    const [selectedNews, setSelectedNews] = useState<NewsDataType | null>(null)
    const [newsData, setNewsData] = useState<NewsDataType[]>(data?.data ?? [])
    const [favorites, setFavorites] = useState<string[]>([])

    const { query, sortType } = useNewsStore(
        useShallow((state) => ({
            query: state.query,
            sortType: state.sortType,
        }))
    )

    const queryValue = query.trim().toLowerCase()

    useEffect(() => {
        const items = data?.data ?? []
        setNewsData(items)

        const favoriteIds = items
            .filter((item) => item.favorite)
            .map((item) => item.article_id)

        setFavorites(favoriteIds)
    }, [data?.data])

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

    const toggleFavorites = (id: string): string[] => {
        return favorites.includes(id)
            ? favorites.filter((favId) => favId !== id)
            : [...favorites, id]
    }

    const handleFavoriteClick = async (id: string) => {
        const previousFavorites = [...favorites]
        setFavorites(toggleFavorites(id))

        try {
            const res = await axios.post<FavoriteApiResponse>('/api/favorite', { id })

            if (!res.data.success) {
                throw new Error('Failed to update favorite')
            }

            const message =
                res.data.message === 'Favorite removed' ? '移除收藏' : '已收藏'
            toastBox(message, 'success')
        } catch (error) {
            console.error('Failed to update favorite:', error)
            setFavorites(previousFavorites)
        }
    }

    const sortedData = useMemo(() => {
        const filtered = newsData.filter(
            (item) =>
                item.title?.toLowerCase().includes(queryValue) ||
                item.description?.toLowerCase().includes(queryValue)
        )

        return [...filtered].sort((a, b) => {
            switch (sortType) {
                case 'rating':
                    return (b.rate || 0) - (a.rate || 0)
                case 'date':
                    return (
                        new Date(b.pubDate).getTime() -
                        new Date(a.pubDate).getTime()
                    )
                default:
                    return 0
            }
        })
    }, [newsData, queryValue, sortType])

    if (!data?.success) {
        return <p>Failed to fetch</p>
    }

    return (
        <div className="news-list">
            {sortedData.length > 0 ? (
                <div className="news-list__grid">
                    {sortedData.map((article) => (
                        <NewsCard
                            key={article.article_id}
                            article={article}
                            favorite={favorites.includes(article.article_id)}
                            onFavoriteClick={handleFavoriteClick}
                            onMoreClick={() => setSelectedNews(article)}
                        />
                    ))}
                </div>
            ) : (
                <p className="news-list__empty">
                    無相符的資料，請重新搜尋
                </p>
            )}

            <NewsModal
                data={selectedNews}
                onClose={() => setSelectedNews(null)}
                onRatingUpdate={handleRatingUpdate}
                open={selectedNews !== null}
            />
        </div>
    )
}

export default NewsList
