'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { FaHeart, FaRegHeart, FaRegEye } from 'react-icons/fa'
import { FaBookmark, FaRegBookmark } from 'react-icons/fa6'
import { IoShareSocialOutline } from 'react-icons/io5'
import { NewsDataType } from '@/types/news'
import StarDisplay from '@/components/molecules/StarDisplay'
import Tooltip from '@/components/atoms/Tooltip'
import { cn } from '@/libs/cn'
import { CARD_CLASSES } from '@/libs/styles'

interface NewsCardProps {
    article: NewsDataType
    favorite: boolean
    onFavoriteClick: (articleId: string) => void
    onLikeClick?: (articleId: string) => void
    onShareClick?: (article: NewsDataType) => void
    onMoreClick?: () => void
}

const ACTION_CLASSES = 'cursor-pointer transition duration-300 hover:opacity-70'

const NewsCard = ({
    article,
    favorite,
    onFavoriteClick,
    onLikeClick,
    onShareClick,
    onMoreClick,
}: NewsCardProps) => {
    const { status } = useSession()
    const isAuthenticated = status === 'authenticated'
    // 剛匯入的新聞沒有 views 欄位，補 0 以免畫面出現 undefined
    const views = article.views ?? 0
    // 媒體的 favicon 位址會改，載不到時退回文字標記而不是留一個破圖
    const [iconFailed, setIconFailed] = useState(false)
    const showIcon = Boolean(article.source_icon) && !iconFailed
    // 提示文字與 aria-label 用同一份，兩者不該說不一樣的話
    const likeLabel = article.liked ? '取消按讚' : '按讚'
    const favoriteLabel = favorite ? '取消收藏' : '加入收藏'

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
                    {showIcon ? (
                        <div className="relative mr-2 h-6 w-6 shrink-0">
                            <Image
                                src={article.source_icon}
                                alt=""
                                sizes="24px"
                                fill
                                onError={() => setIconFailed(true)}
                            />
                        </div>
                    ) : (
                        /* 沒有 logo 就用媒體名稱首字，比放一張通用的灰色方塊好認 */
                        <span
                            aria-hidden
                            className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold text-muted-foreground"
                        >
                            {article.source_name?.trim().charAt(0) || '?'}
                        </span>
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
                        className={cn(ACTION_CLASSES, 'text-primary')}
                        onClick={onMoreClick}
                        type="button"
                    >
                        More
                    </button>

                    <div className="flex items-center gap-4">
                        {/* 按讚與收藏都是「對某人而言」的狀態，未登入沒有意義；
                            分享不需要身分，所以不受登入狀態限制 */}
                        {isAuthenticated && (
                            <>
                                <Tooltip label={likeLabel}>
                                    <button
                                        onClick={() => onLikeClick?.(article.article_id)}
                                        className={cn(
                                            ACTION_CLASSES,
                                            'flex items-center gap-1 text-danger'
                                        )}
                                        type="button"
                                        aria-label={likeLabel}
                                        aria-pressed={article.liked}
                                    >
                                        {article.liked ? <FaHeart /> : <FaRegHeart />}
                                        {article.likes > 0 && (
                                            <span className="text-sm tabular-nums text-subtle">
                                                {article.likes.toLocaleString('zh-TW')}
                                            </span>
                                        )}
                                    </button>
                                </Tooltip>

                                <Tooltip label={favoriteLabel}>
                                    <button
                                        onClick={() => onFavoriteClick(article.article_id)}
                                        className={cn(
                                            ACTION_CLASSES,
                                            'flex items-center gap-1 text-primary'
                                        )}
                                        type="button"
                                        aria-label={favoriteLabel}
                                        aria-pressed={favorite}
                                    >
                                        {favorite ? <FaBookmark /> : <FaRegBookmark />}
                                        {article.favorites > 0 && (
                                            <span className="text-sm tabular-nums text-subtle">
                                                {article.favorites.toLocaleString('zh-TW')}
                                            </span>
                                        )}
                                    </button>
                                </Tooltip>
                            </>
                        )}

                        <Tooltip label="分享">
                            <button
                                onClick={() => onShareClick?.(article)}
                                className={cn(ACTION_CLASSES, 'text-muted-foreground')}
                                type="button"
                                aria-label="分享"
                            >
                                <IoShareSocialOutline />
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </article>
    )
}

export default NewsCard
