import NewsCard from '@/components/organisms/NewsCard'
import { NEWS_GRID_CLASSES } from '@/libs/styles'
import type { NewsDataType } from '@/types/news'

interface NewsInfiniteGridProps {
    /** 目前已載入的文章，由伺服器逐頁提供 */
    items: NewsDataType[]
    /** 符合目前搜尋條件的總筆數，用來判斷是否真的沒有資料 */
    total: number
    favorites: string[]
    hasMore: boolean
    isLoading: boolean
    sentinelRef: React.RefObject<HTMLDivElement | null>
    onFavoriteClick: (id: string) => void
    onMoreClick: (article: NewsDataType) => void
}

const NewsInfiniteGrid = ({
    items,
    total,
    favorites,
    hasMore,
    isLoading,
    sentinelRef,
    onFavoriteClick,
    onMoreClick,
}: NewsInfiniteGridProps) => {
    if (total === 0 && !isLoading) {
        return (
            <p className="flex items-center justify-center p-5 pt-10 text-xl">
                無相符的資料，請重新搜尋
            </p>
        )
    }

    return (
        <>
            <div className={NEWS_GRID_CLASSES}>
                {items.map((article) => (
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
                {isLoading && (
                    <div className="flex items-center gap-2 text-subtle" role="status">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-input border-t-primary" />
                        <span>載入中...</span>
                    </div>
                )}
                {!hasMore && !isLoading && items.length > 0 && (
                    <p className="text-sm text-subtle">已載入全部文章</p>
                )}
            </div>
        </>
    )
}

export default NewsInfiniteGrid
