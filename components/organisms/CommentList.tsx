'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { FaStar, FaRegStar } from 'react-icons/fa'
import { MdDeleteOutline, MdOutlineBlock, MdOutlineEdit } from 'react-icons/md'
import Avatar from '@/components/atoms/Avatar'
import CommentForm from '@/components/molecules/CommentForm'
import { cn } from '@/libs/cn'
import { formatRelativeTime } from '@/libs/time'
import { CARD_CLASSES } from '@/libs/styles'
import type { CommentType } from '@/types/news'

interface CommentListProps {
    comments: CommentType[]
    onDelete?: (commentId: string) => void
    /**
     * 編輯狀態由外層控制而非留在這裡。
     * 送出要先經過確認彈窗，成功後才該退出編輯模式——
     * 那個時機只有發起 API 的那一層知道。
     */
    editingId?: string | null
    onEditStart?: (commentId: string) => void
    onEditCancel?: () => void
    onEditSubmit?: (content: string, rating: number) => Promise<void>
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

const CommentList = ({
    comments,
    onDelete,
    editingId,
    onEditStart,
    onEditCancel,
    onEditSubmit,
}: CommentListProps) => {
    const { data: session } = useSession()
    const currentUserId = session?.user?.id
    const isAdmin = session?.user?.isAdmin === true
    const [filterRating, setFilterRating] = useState<number | null>(null)

    // 被管理員下架的評論沒有評分，篩星等時不該把它們也留下來
    const filtered = filterRating ? comments.filter((c) => c.rating === filterRating) : comments

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
                    {filtered.map((comment) =>
                        comment.isRemovedByAdmin ? (
                            /* 下架的評論留一個墓碑。少一則但編號對不上，
                               比留下說明更讓人困惑，也讓其他人知道確實有被處理。 */
                            <div
                                key={comment._id}
                                className={cn(CARD_CLASSES, 'text-sm text-subtle')}
                            >
                                <p className="flex items-center gap-2">
                                    <MdOutlineBlock size={16} className="shrink-0" />
                                    該評論因違反社群規範已被管理員隱藏
                                </p>
                            </div>
                        ) : (
                            <div key={comment._id} className={CARD_CLASSES}>
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Avatar src={comment.userImage} size="sm" />
                                        <span className="text-sm font-medium">
                                            {comment.userName}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <time
                                            className="text-xs text-subtle"
                                            dateTime={comment.createdAt}
                                        >
                                            {formatRelativeTime(comment.createdAt)}
                                        </time>
                                        {comment.editedAt && (
                                            <span
                                                className="text-xs text-subtle"
                                                title={`編輯於 ${formatRelativeTime(comment.editedAt)}`}
                                            >
                                                （已編輯）
                                            </span>
                                        )}
                                        {/* 編輯只有本人能做——管理員的權限是下架，不是改別人的話 */}
                                        {onEditStart &&
                                            currentUserId === comment.userId &&
                                            editingId !== comment._id && (
                                                <button
                                                    className="cursor-pointer text-muted-foreground transition duration-300 hover:text-foreground"
                                                    onClick={() => onEditStart(comment._id)}
                                                    aria-label="編輯評論"
                                                >
                                                    <MdOutlineEdit size={18} />
                                                </button>
                                            )}
                                        {/* 管理員可以刪任何一則；一般使用者只能刪自己的。
                                            這裡只是介面，真正的判斷在 deleteCommentAction 裡。 */}
                                        {onDelete &&
                                            (isAdmin || currentUserId === comment.userId) && (
                                                <button
                                                    className="cursor-pointer text-danger transition duration-300 hover:opacity-70"
                                                    onClick={() => onDelete(comment._id)}
                                                    aria-label={
                                                        currentUserId === comment.userId
                                                            ? '刪除評論'
                                                            : '刪除評論（管理員）'
                                                    }
                                                >
                                                    <MdDeleteOutline size={18} />
                                                </button>
                                            )}
                                    </div>
                                </div>
                                {editingId === comment._id && onEditSubmit ? (
                                    /* 就地變成編輯表單。沿用 CommentForm，評分與字數限制
                                       的行為才不會跟上方的新增表單分岔 */
                                    <CommentForm
                                        initialRating={comment.rating ?? 0}
                                        initialContent={comment.content}
                                        onSubmit={onEditSubmit}
                                        onCancel={onEditCancel}
                                        submitLabel="儲存修改"
                                    />
                                ) : (
                                    <>
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
                                    </>
                                )}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    )
}

export default CommentList
