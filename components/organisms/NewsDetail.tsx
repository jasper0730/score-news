'use client'

import Image from 'next/image'
import { NewsDataType } from '@/types/news'
import { IoIosCloseCircle } from 'react-icons/io'
import CommentSection from '@/components/organisms/CommentSection'
import DynamicImage from '@/components/atoms/DynamicImage'


interface NewsDetailProps {
    data: NewsDataType | null
    onClose: () => void
    onRatingUpdate: (postId: string, newRating: number) => void
}

const NewsDetail = ({ data, onClose, onRatingUpdate }: NewsDetailProps) => {
    const hasFullContent =
        data?.content &&
        data.content !== 'ONLY AVAILABLE IN PAID PLANS' &&
        data.content.trim() !== ''

    const newsContent = hasFullContent ? data!.content : (data?.description ?? '')

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
                </div>
            </div>

            <div className="mt-5">
                <p className="leading-relaxed text-gray-700 dark:text-gray-300 line-clamp-2">{newsContent}</p>
                {!hasFullContent && data?.link && (
                    <a
                        href={data.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-4 text-sm text-blue-500 hover:text-blue-700 underline duration-200"
                    >
                        閱讀完整原文 →
                    </a>
                )}
            </div>

            {data?.article_id && (
                <CommentSection
                    postId={data.article_id}
                    postTitle={data.title}
                    initialRating={data.userRate ?? 0}
                    onRatingUpdate={onRatingUpdate}
                />
            )}
        </article>
    )
}

export default NewsDetail
