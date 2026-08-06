'use client'

import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { FaHeart, FaRegHeart, FaRegEye } from 'react-icons/fa'
import { NewsDataType } from '@/types/news'
import StarDisplay from '@/components/molecules/StarDisplay'
import { cn } from '@/libs/cn'
import { CARD_CLASSES } from '@/libs/styles'

interface NewsCardProps {
    article: NewsDataType
    favorite: boolean
    onFavoriteClick: (articleId: string) => void
    onMoreClick?: () => void
}

const NewsCard = ({ article, favorite, onFavoriteClick, onMoreClick }: NewsCardProps) => {
    const { status } = useSession()
    const isAuthenticated = status === 'authenticated'
    // 剛匯入的新聞沒有 views 欄位，補 0 以免畫面出現 undefined
    const views = article.views ?? 0

    return (
        <article className={cn(CARD_CLASSES, 'flex flex-col shadow-sm')}>
            <div className="flex flex-col">
                <h2 className="line-clamp-2 text-xl font-semibold leading-snug">{article.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {article.description}
                </p>
                {/* 日期與點閱數同屬次要資訊，併成一行避免卡片被撐高 */}
                <div className="mt-2 flex items-center gap-3 text-sm text-subtle">
                    <time>日期：{article.pubDate}</time>
                    {/* 用 role="img" 給文字替代，與 StarDisplay 一致——
                        圖示本身對螢幕閱讀器沒有意義，數字也需要單位才讀得懂 */}
                    <span
                        className="flex shrink-0 items-center gap-1 tabular-nums"
                        role="img"
                        aria-label={`點閱 ${views} 次`}
                    >
                        <FaRegEye />
                        {views.toLocaleString('zh-TW')}
                    </span>
                </div>

                <div className="mt-4 flex items-center">
                    {article.source_icon && (
                        <div className="relative mr-2 h-6 w-6">
                            <Image src={article.source_icon} alt="" sizes="24px" fill />
                        </div>
                    )}
                    <a
                        href={article.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                    >
                        {article.source_name}
                    </a>
                </div>
            </div>

            <div className="mt-auto">
                <StarDisplay rating={article.rate} />

                <div className="mt-4 flex items-center justify-between">
                    <button
                        className="cursor-pointer text-primary transition duration-300 hover:opacity-70"
                        onClick={onMoreClick}
                        type="button"
                    >
                        More
                    </button>
                    {isAuthenticated && (
                        <button
                            onClick={() => onFavoriteClick(article.article_id)}
                            className="cursor-pointer text-danger transition duration-300 hover:opacity-70"
                            type="button"
                            aria-label={favorite ? '取消收藏' : '加入收藏'}
                        >
                            {favorite ? <FaHeart /> : <FaRegHeart />}
                        </button>
                    )}
                </div>
            </div>
        </article>
    )
}

export default NewsCard
