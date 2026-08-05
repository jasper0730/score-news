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
        <article className="relative m-auto rounded-lg bg-surface px-5 py-20 md:px-10">
            <button
                onClick={onClose}
                className="absolute left-1/2 top-5 -translate-x-1/2 cursor-pointer transition duration-300 hover:rotate-90"
                aria-label="關閉新聞詳情"
            >
                <IoIosCloseCircle size={40} />
            </button>

            <div className="flex flex-col gap-8 md:flex-row">
                <div className="relative mx-auto max-w-[400px] md:w-1/2 md:max-w-none">
                    {data?.image_url ? (
                        <DynamicImage
                            src={data.image_url}
                            alt={data.title ?? '新聞圖片'}
                            className="h-auto w-full rounded-lg object-cover"
                        />
                    ) : (
                        <Image
                            src="/images/no-image.jpg"
                            alt={data?.title ?? '無圖片'}
                            sizes="(min-width: 768px) 50vw, 400px"
                            fill
                        />
                    )}
                </div>
                <div className="md:w-1/2">
                    <h2 className="text-xl font-bold">{data?.title}</h2>
                </div>
            </div>

            <div className="mt-5">
                <p className="line-clamp-2 leading-relaxed text-muted-foreground">{newsContent}</p>
                {!hasFullContent && data?.link && (
                    <a
                        href={data.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1 text-sm text-primary underline transition duration-200 hover:opacity-70"
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
