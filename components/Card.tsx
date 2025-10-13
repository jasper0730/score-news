'use client'

import { FaStar, FaHeart, FaRegHeart } from 'react-icons/fa'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { NewsDataType } from '@/types/news'

type NewsCardProps = {
    article: NewsDataType
    favorite: boolean
    onFavoriteClick: (articleId: string) => void
    onMoreClick?: () => void
}

const Card = ({ article, favorite, onFavoriteClick, onMoreClick }: NewsCardProps) => {
    const currentUser = useSession()
    const isAdmin = currentUser.status === 'authenticated'

    return (
        <div className="p-4 border rounded-lg shadow-lg">
            <div className="text-gray-600 dark:text-white flex flex-col h-full">
                <div>
                    <h2 className="text-lg font-bold line-clamp-2">{article.title}</h2>
                    <p className="mt-2 line-clamp-3">{article.description}</p>
                    <p className="mt-2 text-sm">日期：{article.pubDate}</p>
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
                    {article.rate && article.rate > 0 && (
                        <div className="flex items-center mt-4">
                            {Array.from({ length: article.rate }).map((item, index) => (
                                <div key={index} className="text-yellow-500 text-xl">
                                    <FaStar />
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center justify-between mt-4">
                        <div
                            className="mt-auto text-blue-500 cursor-pointer hover:opacity-70"
                            onClick={onMoreClick}
                        >
                            More
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => onFavoriteClick(article.article_id)}
                                className="text-red-500 hover:opacity-70"
                            >
                                {favorite ? <FaHeart /> : <FaRegHeart />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Card
