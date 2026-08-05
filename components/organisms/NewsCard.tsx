'use client'

import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { FaHeart, FaRegHeart } from 'react-icons/fa'
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

    return (
        <article className={cn(CARD_CLASSES, 'flex flex-col shadow-lg')}>
            <div className="flex flex-col">
                <h2 className="line-clamp-2 text-lg font-bold">{article.title}</h2>
                <p className="mt-2 line-clamp-2 text-muted-foreground">{article.description}</p>
                <time className="mt-2 text-sm text-muted-foreground">日期：{article.pubDate}</time>

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
