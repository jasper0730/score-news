import NewsCard from '@/components/organisms/NewsCard'
import { NEWS_GRID_CLASSES } from '@/libs/styles'
import type { NewsDataType } from '@/types/news'

interface NewsInfiniteGridProps {
    visibleData: NewsDataType[]
    sortedDataLength: number
    favorites: string[]
    hasMore: boolean
    isLoadingMore: boolean
    sentinelRef: React.RefObject<HTMLDivElement | null>
    onFavoriteClick: (id: string) => void
    onMoreClick: (article: NewsDataType) => void
}

const PAGE_SIZE = 8

const NewsInfiniteGrid = ({
    visibleData,
    sortedDataLength,
    favorites,
    hasMore,
    isLoadingMore,
    sentinelRef,
    onFavoriteClick,
    onMoreClick,
}: NewsInfiniteGridProps) => {
    if (sortedDataLength === 0) {
        return (
            <p className="flex items-center justify-center p-5 pt-10 text-xl">
                無相符的資料，請重新搜尋
            </p>
        )
    }

    return (
        <>
            <div className={NEWS_GRID_CLASSES}>
                {visibleData.map((article) => (
                    <NewsCard
                        key={article.article_id}
                        article={article}
                        favorite={favorites.includes(article.article_id)}
                        onFavoriteClick={onFavoriteClick}
                        onMoreClick={() => onMoreClick(article)}
                    />
                ))}
            </div>

            <div ref={sentinelRef} className="flex justify-center py-6">
                {isLoadingMore && (
                    <div className="flex items-center gap-2 text-subtle" role="status">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-input border-t-primary" />
                        <span>載入更多...</span>
                    </div>
                )}
                {!hasMore && sortedDataLength > PAGE_SIZE && (
                    <p className="text-sm text-subtle">已載入全部文章</p>
                )}
            </div>
        </>
    )
}

export default NewsInfiniteGrid
