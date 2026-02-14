'use client'

import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { NewsDataType } from '@/types/news'
import { IoIosCloseCircle } from 'react-icons/io'
import RatingForm from '@/components/organisms/RatingForm'
import CommentSection from '@/components/organisms/CommentSection'
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
        <article className="m-auto px-5 py-20 relative bg-white rounded-lg dark:bg-gray-900 md:px-10">
            <button
                onClick={onClose}
                className="absolute top-5 left-1/2 -translate-x-1/2 cursor-pointer hover:rotate-90 duration-300"
                aria-label="關閉新聞詳情"
            >
                <IoIosCloseCircle size={40} />
            </button>

            <div className="flex flex-col gap-8 md:flex-row">
                <div className="max-w-[400px] relative mx-auto md:w-1/2 md:max-w-none">
                    {data?.image_url ? (
                        <DynamicImage
                            src={data.image_url}
                            alt={data.title ?? '新聞圖片'}
                            className="object-cover w-full h-auto rounded-lg"
                        />
                    ) : (
                        <Image
                            src="/images/no-image.jpg"
                            alt={data?.title ?? '無圖片'}
                            fill
                        />
                    )}
                </div>
                <div className="md:w-1/2">
                    <h2 className="text-xl font-bold">{data?.title}</h2>
                    <p className="text-gray-600">{data?.description}</p>
                </div>
            </div>

            <div className="mt-5">
                <p>{newsContent}</p>
            </div>

            {isAuthenticated && (
                <div className="mt-8">
                    <RatingForm
                        postId={data?.article_id}
                        onRatingUpdate={onRatingUpdate}
                    />
                </div>
            )}

            {data?.article_id && (
                <CommentSection
                    postId={data.article_id}
                    postTitle={data.title}
                />
            )}
        </article>
    )
}

export default NewsDetail
