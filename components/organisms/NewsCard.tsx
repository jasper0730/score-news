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
        <article className="p-4 border rounded-lg shadow-lg">
            <div className="text-gray-600 dark:text-white flex flex-col h-full">
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold line-clamp-2">{article.title}</h2>
                    <p className="mt-2 line-clamp-2">{article.description}</p>
                    <time className="mt-2 text-sm">日期：{article.pubDate}</time>

                    <div className="flex items-center mt-4">
                        {article.source_icon && (
                            <div className="w-6 h-6 mr-2 relative">
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
                            className="text-sm text-blue-500 hover:underline"
                        >
                            {article.source_name}
                        </a>
                    </div>
                </div>

                <div className="mt-auto">
                    <StarDisplay rating={article.rate} />

                    <div className="flex items-center justify-between mt-4">
                        <button
                            className="text-blue-500 cursor-pointer hover:opacity-70"
                            onClick={onMoreClick}
                            type="button"
                        >
                            More
                        </button>
                        {isAuthenticated && (
                            <button
                                onClick={() => onFavoriteClick(article.article_id)}
                                className="text-red-500 hover:opacity-70 cursor-pointer"
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
