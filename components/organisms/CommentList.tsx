'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { FaStar, FaRegStar } from 'react-icons/fa'
import { MdDeleteOutline } from 'react-icons/md'
import Avatar from '@/components/atoms/Avatar'
import type { CommentType } from '@/types/news'

interface CommentListProps {
    comments: CommentType[]
    onDelete?: (commentId: string) => void
}

const STAR_FILTERS = [1, 2, 3, 4, 5]

const StarBadge = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) =>
            i < rating
                ? <FaStar key={i} className="text-yellow-400 text-sm" />
                : <FaRegStar key={i} className="text-gray-300 text-sm" />
        )}
    </div>
)

const CommentList = ({ comments, onDelete }: CommentListProps) => {
    const { data: session } = useSession()
    const currentUserId = (session?.user as { id?: string })?.id
    const [filterRating, setFilterRating] = useState<number | null>(null)

    const filtered = filterRating
        ? comments.filter((c) => c.rating === filterRating)
        : comments

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('zh-TW', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        })

    return (
        <div className="mt-4">
            {/* 星星篩選器 */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <button
                    className={`px-3 py-1 text-sm rounded-full border transition-colors cursor-pointer ${filterRating === null ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:border-blue-400'}`}
                    onClick={() => setFilterRating(null)}
                >
                    全部
                </button>
                {STAR_FILTERS.map((star) => (
                    <button
                        key={star}
                        className={`flex items-center gap-1 px-3 py-1 text-sm rounded-full border transition-colors cursor-pointer ${filterRating === star ? 'bg-yellow-400 text-white border-yellow-400' : 'border-gray-300 hover:border-yellow-400'}`}
                        onClick={() => setFilterRating(filterRating === star ? null : star)}
                    >
                        {star} <FaStar className="text-xs" />
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <p className="text-gray-400 text-center py-6">
                    {filterRating ? `目前沒有 ${filterRating} 顆星的評論` : '目前還沒有評論，成為第一個留言的人吧！'}
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    {filtered.map((comment) => (
                        <div key={comment._id} className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Avatar src={comment.userImage} size="sm" />
                                    <span className="text-sm font-medium">{comment.userName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <time className="text-xs text-gray-400">{formatDate(comment.createdAt)}</time>
                                    {currentUserId === comment.userId && onDelete && (
                                        <button
                                            className="text-red-400 hover:text-red-600 cursor-pointer duration-300"
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
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default CommentList
