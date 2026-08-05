'use client'

import { useNewsFeed } from '@/hooks/useNewsFeed'
import type { NewsResponse } from '@/actions/newsActions'
import NewsInfiniteGrid from '@/components/organisms/NewsInfiniteGrid'
import NewsModal from '@/components/organisms/NewsModal'

interface NewsListProps {
    data: NewsResponse
}

const NewsList = ({ data }: NewsListProps) => {
    const {
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
    } = useNewsFeed(data)

    if (!data.success) {
        return <p className="p-10 text-center text-xl text-muted-foreground">新聞載入失敗</p>
    }

    return (
        <div className="min-h-screen px-4 py-10">
            <NewsInfiniteGrid
                items={items}
                total={total}
                favorites={favorites}
                hasMore={hasMore}
                isLoading={isLoading}
                sentinelRef={sentinelRef}
                onFavoriteClick={handleFavoriteClick}
                onMoreClick={handleSelectNews}
            />

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
