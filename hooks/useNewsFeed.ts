'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNewsStore } from '@/store/newsStore'
import { useShallow } from 'zustand/shallow'
import { toastBox } from '@/utils/toast'
import { toggleFavoriteAction } from '@/actions/favoriteActions'
import { rateNewsAction } from '@/actions/rateNewsAction'
import { incrementViewAction } from '@/actions/viewActions'
import type { NewsDataType, NewsApiResponse } from '@/types/news'

const PAGE_SIZE = 8

export function useNewsFeed(data: NewsApiResponse) {
    const [selectedNews, setSelectedNews] = useState<NewsDataType | null>(null)
    const [newsData, setNewsData] = useState<NewsDataType[]>(data?.data ?? [])
    const [favorites, setFavorites] = useState<string[]>([])
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const sentinelRef = useRef<HTMLDivElement>(null)

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
        setFavorites(items.filter((item) => item.favorite).map((item) => item.article_id))
    }, [data?.data])

    const sortedData = useMemo(() => {
        const filtered = newsData.filter(
            (item) =>
                item.title?.toLowerCase().includes(queryValue) ||
                item.description?.toLowerCase().includes(queryValue)
        )
        return [...filtered].sort((a, b) => {
            switch (sortType) {
                case 'rating_desc':
                    return (b.rate || 0) - (a.rate || 0)
                case 'rating_asc':
                    return (a.rate || 0) - (b.rate || 0)
                case 'date_desc':
                    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
                case 'date_asc':
                    return new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime()
                case 'views':
                    return (b.views || 0) - (a.views || 0)
                default:
                    return 0
            }
        })
    }, [newsData, queryValue, sortType])

    useEffect(() => {
        setVisibleCount(PAGE_SIZE)
    }, [queryValue, sortType])

    const hasMore = visibleCount < sortedData.length
    const visibleData = useMemo(() => sortedData.slice(0, visibleCount), [sortedData, visibleCount])

    const loadMore = useCallback(() => {
        if (!hasMore || isLoadingMore) return
        setIsLoadingMore(true)
        setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, sortedData.length))
            setIsLoadingMore(false)
        }, 300)
    }, [hasMore, isLoadingMore, sortedData.length])

    useEffect(() => {
        const sentinel = sentinelRef.current
        if (!sentinel) return
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) loadMore() },
            { rootMargin: '200px' }
        )
        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [loadMore])

    const handleSelectNews = useCallback(async (news: NewsDataType | null) => {
        setSelectedNews(news)
        if (news) {
            try {
                const result = await incrementViewAction(news.article_id)
                if (result.success) {
                    setNewsData((prev) =>
                        prev.map((n) =>
                            n.article_id === news.article_id ? { ...n, views: result.views } : n
                        )
                    )
                }
            } catch {
                // silently fail — view count is non-critical
            }
        }
    }, [])

    const handleRatingUpdate = async (postId: string, newRating: number) => {
        try {
            const result = await rateNewsAction(postId, newRating)
            if (result.success) {
                setNewsData((prev) =>
                    prev.map((n) => n.article_id === postId ? { ...n, rate: result.rate } : n)
                )
                if (selectedNews?.article_id === postId) {
                    setSelectedNews((prev) => prev ? { ...prev, rate: result.rate } : null)
                }
            }
        } catch (error) {
            console.error('Failed to update rating:', error)
        }
    }

    const toggleFavorites = (id: string): string[] =>
        favorites.includes(id)
            ? favorites.filter((favId) => favId !== id)
            : [...favorites, id]

    const handleFavoriteClick = async (id: string) => {
        const previousFavorites = [...favorites]
        setFavorites(toggleFavorites(id))
        try {
            const result = await toggleFavoriteAction(id)
            if (!result.success) throw new Error('Failed to update favorite')
            const message = result.message === 'Favorite removed' ? '移除收藏' : '已收藏'
            toastBox(message, 'success')
        } catch (error) {
            console.error('Failed to update favorite:', error)
            setFavorites(previousFavorites)
        }
    }

    return {
        visibleData,
        sortedData,
        favorites,
        hasMore,
        isLoadingMore,
        sentinelRef,
        selectedNews,
        setSelectedNews,
        handleSelectNews,
        handleFavoriteClick,
        handleRatingUpdate,
    }
}
