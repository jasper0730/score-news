'use client'

import { useNewsFeed } from '@/hooks/useNewsFeed'
import type { NewsApiResponse } from '@/types/news'
import NewsInfiniteGrid from '@/components/organisms/NewsInfiniteGrid'
import NewsModal from '@/components/organisms/NewsModal'

interface NewsListProps {
    data: NewsApiResponse
}

const NewsList = ({ data }: NewsListProps) => {
    const {
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
    } = useNewsFeed(data)

    if (!data?.success) {
        return <p>Failed to fetch</p>
    }

    return (
        <div className="min-h-screen px-4 py-10">
            <NewsInfiniteGrid
                visibleData={visibleData}
                sortedDataLength={sortedData.length}
                favorites={favorites}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
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
