'use client'

import Image from 'next/image'
import { NewsDataType, RatingSummaryType } from '@/types/news'
import { IoIosCloseCircle } from 'react-icons/io'
import CommentSection from '@/components/organisms/CommentSection'

interface NewsDetailProps {
    data: NewsDataType | null
    onClose: () => void
    onRatingUpdate: (postId: string, rating: RatingSummaryType) => void
}

const NewsDetail = ({ data, onClose, onRatingUpdate }: NewsDetailProps) => {
    const hasFullContent =
        data?.content &&
        data.content !== 'ONLY AVAILABLE IN PAID PLANS' &&
        data.content.trim() !== ''

    const newsContent = hasFullContent ? data!.content : (data?.description ?? '')

    return (
        <article className="flex h-full flex-col overflow-hidden rounded-lg bg-surface">
            {/* 關閉列固定在頂端，內容再長也不會被捲走 */}
            <div className="flex shrink-0 justify-center border-b py-4">
                <button
                    onClick={onClose}
                    className="cursor-pointer transition duration-300 hover:rotate-90"
                    aria-label="關閉新聞詳情"
                >
                    <IoIosCloseCircle size={40} />
                </button>
            </div>

            {/* 內容超出固定高度時只在這一層捲動；overscroll-contain 避免捲到底時帶動背景頁面 */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 md:px-10">
                <div className="flex flex-col gap-8 md:flex-row">
                    {/* 用固定長寬比預留空間，尺寸由 CSS 決定而非等圖片載入後回填，
                        圖片載入完成時不會推動下方內容 */}
                    <div className="relative mx-auto aspect-video w-full max-w-[400px] overflow-hidden rounded-lg md:w-1/2 md:max-w-none">
                        <Image
                            src={data?.image_url || '/images/no-image.jpg'}
                            alt={data?.title ?? '新聞圖片'}
                            sizes="(min-width: 768px) 50vw, 400px"
                            className="object-cover"
                            fill
                        />
                    </div>
                    <div className="md:w-1/2">
                        <h2 className="text-2xl font-semibold leading-snug">{data?.title}</h2>
                    </div>
                </div>

                <div className="mt-5">
                    <p className="line-clamp-2 leading-relaxed text-muted-foreground">
                        {newsContent}
                    </p>
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
            </div>
        </article>
    )
}

export default NewsDetail
