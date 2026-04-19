import NewsCard from '@/components/organisms/NewsCard'
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
            <p className="p-5 pt-10 flex justify-center items-center text-xl">
                無相符的資料，請重新搜尋
            </p>
        )
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

            <div ref={sentinelRef} className="py-6 flex justify-center">
                {isLoadingMore && (
                    <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                        <span>載入更多...</span>
                    </div>
                )}
                {!hasMore && sortedDataLength > PAGE_SIZE && (
                    <p className="text-sm text-gray-400">已載入全部文章</p>
                )}
            </div>
        </>
    )
}

export default NewsInfiniteGrid
