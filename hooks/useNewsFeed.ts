'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNewsStore } from '@/store/newsStore'
import { useShallow } from 'zustand/shallow'
import { toastBox } from '@/utils/toast'
import { getNewsActions, type NewsResponse } from '@/actions/newsActions'
import { toggleFavoriteAction } from '@/actions/favoriteActions'
import { rateNewsAction } from '@/actions/rateNewsAction'
import { incrementViewAction } from '@/actions/viewActions'
import type { NewsDataType } from '@/types/news'

import { NEWS_PAGE_SIZE } from '@/constants/common'

/**
 * 搜尋、排序、分頁全部交給伺服器。
 *
 * 先前是一次抓 1000 筆塞進 client 再於瀏覽器端 filter/sort/slice，
 * payload 會隨資料量線性成長，且每次搜尋都要對整個陣列重跑一次。
 * 現在只有目前這一頁會進到瀏覽器。
 */
export function useNewsFeed(initial: NewsResponse) {
    const [selectedNews, setSelectedNews] = useState<NewsDataType | null>(null)
    const [items, setItems] = useState<NewsDataType[]>(initial.data)
    const [favorites, setFavorites] = useState<string[]>(() =>
        initial.data.filter((item) => item.favorite).map((item) => item.article_id)
    )
    const [total, setTotal] = useState(initial.total)
    const [hasMore, setHasMore] = useState(initial.hasMore)
    const [isLoading, setIsLoading] = useState(false)

    const pageRef = useRef(1)
    // 每次請求遞增；回來時對不上代表已有更新的請求，直接丟棄避免舊結果覆蓋新結果
    const requestIdRef = useRef(0)
    const sentinelRef = useRef<HTMLDivElement>(null)
    // 首次掛載時不重抓，直接沿用伺服器已經渲染好的第一頁
    const isFirstRun = useRef(true)

    const { query, sortType } = useNewsStore(
        useShallow((state) => ({ query: state.query, sortType: state.sortType }))
    )

    const fetchPage = useCallback(
        async (page: number, mode: 'replace' | 'append') => {
            const requestId = ++requestIdRef.current
            setIsLoading(true)
            try {
                const result = await getNewsActions({
                    query,
                    sortType,
                    page,
                    limit: NEWS_PAGE_SIZE,
                })
                if (requestId !== requestIdRef.current) return
                if (!result.success) {
                    toastBox('載入失敗，請稍後再試', 'error')
                    return
                }

                pageRef.current = page
                const incomingFavorites = result.data
                    .filter((item) => item.favorite)
                    .map((item) => item.article_id)

                setItems((prev) => (mode === 'replace' ? result.data : [...prev, ...result.data]))
                setFavorites((prev) =>
                    mode === 'replace'
                        ? incomingFavorites
                        : [...new Set([...prev, ...incomingFavorites])]
                )
                setTotal(result.total)
                setHasMore(result.hasMore)
            } finally {
                if (requestId === requestIdRef.current) setIsLoading(false)
            }
        },
        [query, sortType]
    )

    // 搜尋字串或排序方式變動時回到第一頁重新查詢
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false
            return
        }
        fetchPage(1, 'replace')
    }, [fetchPage])

    const loadMore = useCallback(() => {
        if (!hasMore || isLoading) return
        fetchPage(pageRef.current + 1, 'append')
    }, [hasMore, isLoading, fetchPage])

    useEffect(() => {
        const sentinel = sentinelRef.current
        if (!sentinel) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) loadMore()
            },
            { rootMargin: '200px' }
        )
        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [loadMore])

    const handleSelectNews = useCallback(async (news: NewsDataType | null) => {
        setSelectedNews(news)
        if (!news) return
        try {
            const result = await incrementViewAction(news.article_id)
            if (result.success) {
                setItems((prev) =>
                    prev.map((n) =>
                        n.article_id === news.article_id ? { ...n, views: result.views } : n
                    )
                )
            }
        } catch {
            // 瀏覽次數不是關鍵資料，失敗就算了
        }
    }, [])

    const handleRatingUpdate = async (postId: string, newRating: number) => {
        try {
            const result = await rateNewsAction(postId, newRating)
            if (!result.success) return

            setItems((prev) =>
                prev.map((n) => (n.article_id === postId ? { ...n, rate: result.rate } : n))
            )
            if (selectedNews?.article_id === postId) {
                setSelectedNews((prev) => (prev ? { ...prev, rate: result.rate } : null))
            }
        } catch (error) {
            console.error('Failed to update rating:', error)
        }
    }

    const handleFavoriteClick = async (id: string) => {
        const previousFavorites = [...favorites]
        setFavorites((prev) =>
            prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
        )
        try {
            const result = await toggleFavoriteAction(id)
            if (!result.success) throw new Error('Failed to update favorite')
            toastBox(result.message === 'Favorite removed' ? '移除收藏' : '已收藏', 'success')
        } catch (error) {
            console.error('Failed to update favorite:', error)
            setFavorites(previousFavorites)
        }
    }

    return {
        items,
        total,
        favorites,
        hasMore,
        isLoading,
        sentinelRef,
        selectedNews,
        setSelectedNews,
        handleSelectNews,
        handleFavoriteClick,
        handleRatingUpdate,
    }
}
