'use client'

import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { NewsDataType } from '@/types/news'
import { IoIosCloseCircle } from 'react-icons/io'
import RatingForm from '@/components/organisms/RatingForm'
import DynamicImage from '@/components/atoms/DynamicImage'

const DEFAULT_CONTENT =
    '我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容'

interface NewsDetailProps {
    data: NewsDataType | null
    onClose: () => void
    onRatingUpdate: (postId: string, newRating: number) => void
}

const NewsDetail = ({ data, onClose, onRatingUpdate }: NewsDetailProps) => {
    const { status } = useSession()
    const isAuthenticated = status === 'authenticated'

    const newsContent =
        data?.content && data.content !== 'ONLY AVAILABLE IN PAID PLANS'
            ? data.content
            : DEFAULT_CONTENT

    return (
        <article className="news-detail">
            <button
                onClick={onClose}
                className="news-detail__close"
                aria-label="關閉新聞詳情"
            >
                <IoIosCloseCircle size={40} />
            </button>

            <div className="news-detail__header">
                <div className="news-detail__image-wrapper">
                    {data?.image_url ? (
                        <DynamicImage
                            src={data.image_url}
                            alt={data.title ?? '新聞圖片'}
                            className="news-detail__image"
                        />
                    ) : (
                        <Image
                            src="/images/no-image.jpg"
                            alt={data?.title ?? '無圖片'}
                            fill
                        />
                    )}
                </div>
                <div className="news-detail__meta">
                    <h2 className="news-detail__title">{data?.title}</h2>
                    <p className="news-detail__description">{data?.description}</p>
                </div>
            </div>

            <div className="news-detail__body">
                <p>{newsContent}</p>
            </div>

            {isAuthenticated && (
                <div className="news-detail__rating">
                    <RatingForm
                        postId={data?.article_id}
                        onRatingUpdate={onRatingUpdate}
                    />
                </div>
            )}
        </article>
    )
}

export default NewsDetail
