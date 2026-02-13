'use client'

import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { FaHeart, FaRegHeart } from 'react-icons/fa'
import { NewsDataType } from '@/types/news'
import StarDisplay from '@/components/molecules/StarDisplay'

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
        <article className="news-card">
            <div className="news-card__body">
                <div className="news-card__content">
                    <h2 className="news-card__title">{article.title}</h2>
                    <p className="news-card__description">{article.description}</p>
                    <time className="news-card__date">日期：{article.pubDate}</time>

                    <div className="news-card__source">
                        {article.source_icon && (
                            <div className="news-card__source-icon">
                                <Image
                                    src={article.source_icon}
                                    alt={`${article.source_name} icon`}
                                    fill
                                />
                            </div>
                        )}
                        <a
                            href={article.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="news-card__source-link"
                        >
                            {article.source_name}
                        </a>
                    </div>
                </div>

                <div className="news-card__footer">
                    <StarDisplay rating={article.rate} />

                    <div className="news-card__actions">
                        <button
                            className="news-card__more"
                            onClick={onMoreClick}
                            type="button"
                        >
                            More
                        </button>
                        {isAuthenticated && (
                            <button
                                onClick={() => onFavoriteClick(article.article_id)}
                                className="news-card__favorite"
                                type="button"
                                aria-label={favorite ? '取消收藏' : '加入收藏'}
                            >
                                {favorite ? <FaHeart /> : <FaRegHeart />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    )
}

export default NewsCard
