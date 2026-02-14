'use client'

import { useSession } from 'next-auth/react'
import { MdDeleteOutline } from 'react-icons/md'
import Avatar from '@/components/atoms/Avatar'
import type { CommentType } from '@/types/news'

interface CommentListProps {
    comments: CommentType[]
    onDelete?: (commentId: string) => void
}

const CommentList = ({ comments, onDelete }: CommentListProps) => {
    const { data: session } = useSession()
    const currentUserId = (session?.user as { id?: string })?.id

    if (comments.length === 0) {
        return <p className="text-gray-400 text-center py-6">目前還沒有評論，成為第一個留言的人吧！</p>
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div className="mt-4 flex flex-col gap-4">
            {comments.map((comment) => (
                <div key={comment._id} className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Avatar src={comment.userImage} size="sm" />
                            <span className="text-sm font-medium">
                                {comment.userName}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <time className="text-xs text-gray-400">
                                {formatDate(comment.createdAt)}
                            </time>
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
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                </div>
            ))}
        </div>
    )
}

export default CommentList
