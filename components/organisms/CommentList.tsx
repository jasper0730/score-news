'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { FaStar, FaRegStar } from 'react-icons/fa'
import { MdDeleteOutline } from 'react-icons/md'
import Avatar from '@/components/atoms/Avatar'
import { cn } from '@/libs/cn'
import { CARD_CLASSES } from '@/libs/styles'
import type { CommentType } from '@/types/news'

interface CommentListProps {
    comments: CommentType[]
    onDelete?: (commentId: string) => void
}

const STAR_FILTERS = [1, 2, 3, 4, 5]

const FILTER_CHIP_CLASSES =
    'flex cursor-pointer items-center rounded-full border border-input px-3 py-1 text-sm transition-colors'

const StarBadge = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5" role="img" aria-label={`評分 ${rating} 顆星`}>
        {Array.from({ length: 5 }, (_, i) =>
            i < rating ? (
                <FaStar key={i} className="text-sm text-star" />
            ) : (
                <FaRegStar key={i} className="text-sm text-subtle" />
            )
        )}
    </div>
)

const CommentList = ({ comments, onDelete }: CommentListProps) => {
    const { data: session } = useSession()
    const currentUserId = session?.user?.id
    const [filterRating, setFilterRating] = useState<number | null>(null)

    const filtered = filterRating ? comments.filter((c) => c.rating === filterRating) : comments

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        })

    return (
        <div className="mt-4">
            {/* 星星篩選器 */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                    className={cn(
                        FILTER_CHIP_CLASSES,
                        filterRating === null
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'hover:border-ring'
                    )}
                    aria-pressed={filterRating === null}
                    onClick={() => setFilterRating(null)}
                >
                    全部
                </button>
                {STAR_FILTERS.map((star) => (
                    <button
                        key={star}
                        className={cn(
                            FILTER_CHIP_CLASSES,
                            'gap-1',
                            filterRating === star
                                ? 'border-star bg-star text-star-foreground'
                                : 'hover:border-star'
                        )}
                        aria-pressed={filterRating === star}
                        onClick={() => setFilterRating(filterRating === star ? null : star)}
                    >
                        {star} <FaStar className="text-xs" />
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <p className="py-6 text-center text-subtle">
                    {filterRating
                        ? `目前沒有 ${filterRating} 顆星的評論`
                        : '目前還沒有評論，成為第一個留言的人吧！'}
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    {filtered.map((comment) => (
                        <div key={comment._id} className={CARD_CLASSES}>
                            <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Avatar src={comment.userImage} size="sm" />
                                    <span className="text-sm font-medium">{comment.userName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <time className="text-xs text-subtle">
                                        {formatDate(comment.createdAt)}
                                    </time>
                                    {currentUserId === comment.userId && onDelete && (
                                        <button
                                            className="cursor-pointer text-danger transition duration-300 hover:opacity-70"
                                            onClick={() => onDelete(comment._id)}
                                            aria-label="刪除評論"
                                        >
                                            <MdDeleteOutline size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {comment.rating != null && comment.rating > 0 && (
                                <div className="mb-2">
                                    <StarBadge rating={comment.rating} />
                                </div>
                            )}
                            {comment.content && (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                    {comment.content}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default CommentList
