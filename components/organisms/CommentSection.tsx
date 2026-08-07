'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toastBox } from '@/utils/toast'
import {
    getCommentsByPostId,
    createCommentAction,
    deleteCommentAction,
} from '@/actions/commentActions'
import CommentForm from '@/components/molecules/CommentForm'
import ConfirmDialog from '@/components/molecules/ConfirmDialog'
import CommentList from '@/components/organisms/CommentList'
import type { CommentType } from '@/types/news'

interface CommentSectionProps {
    postId: string
    postTitle: string
    initialRating?: number
    onRatingUpdate?: (postId: string, newRating: number) => void
}

/** 待確認的動作。送出、修改、刪除都要先經過彈窗才會打 API */
type PendingAction =
    | { type: 'create'; content: string; rating: number }
    | { type: 'edit'; content: string; rating: number }
    | { type: 'delete'; commentId: string; isOthers: boolean }

const DIALOG_COPY: Record<
    PendingAction['type'],
    { title: string; description: string; confirmLabel: string; variant?: 'danger' }
> = {
    create: {
        title: '送出評論？',
        description: '送出後其他讀者就會看到這則評論，你隨時可以再修改或刪除。',
        confirmLabel: '送出',
    },
    edit: {
        title: '儲存修改？',
        description: '修改後會標示為「已編輯」，原本的內容會保留在編輯紀錄中。',
        confirmLabel: '儲存',
    },
    delete: {
        title: '刪除這則評論？',
        description: '刪除後評論不會再顯示，這個動作無法復原。',
        confirmLabel: '刪除',
        variant: 'danger',
    },
}

const CommentSection = ({
    postId,
    postTitle,
    initialRating = 0,
    onRatingUpdate,
}: CommentSectionProps) => {
    const { data: session, status } = useSession()
    const isAuthenticated = status === 'authenticated'
    const currentUserId = session?.user?.id
    const [comments, setComments] = useState<CommentType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [pending, setPending] = useState<PendingAction | null>(null)
    // 送出成功後換掉 key 讓新增表單重新掛載，內容與評分才會清空
    const [formKey, setFormKey] = useState(0)

    const fetchComments = useCallback(async () => {
        try {
            const result = await getCommentsByPostId(postId)
            if (result.success) {
                setComments(result.comments)
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error)
        } finally {
            setIsLoading(false)
        }
    }, [postId])

    useEffect(() => {
        if (postId) {
            fetchComments()
        }
    }, [postId, fetchComments])

    const ownComment = useMemo(
        () => comments.find((c) => c.userId === currentUserId) ?? null,
        [comments, currentUserId]
    )
    // 自己的評論被管理員下架時不給重新發表——server action 也會擋，
    // 但讓表單直接消失比送出後才被拒絕清楚得多
    const isOwnRemoved = ownComment?.isRemovedByAdmin === true

    /**
     * 已經評論過就不再顯示新增表單。
     *
     * 同一位使用者對同一篇文章只會有一則評論（createCommentAction 是 upsert），
     * 留著表單只會讓人以為能再發一則，實際上是覆蓋掉舊的。
     * 要改內容請用列表裡那則的編輯鈕。
     */
    const showCreateForm = isAuthenticated && !isOwnRemoved && !ownComment

    const runCreateOrEdit = async (content: string, rating: number) => {
        try {
            const result = await createCommentAction(
                postId,
                postTitle,
                content,
                rating > 0 ? rating : undefined
            )

            if (!result.success) {
                toastBox(result.error ?? '評論失敗，請稍後再試', 'error')
                return
            }

            // 平均評分由伺服器算好回傳，前端不再自行推測
            onRatingUpdate?.(postId, result.averageRating)
            await fetchComments()
            setEditingId(null)
            setFormKey((k) => k + 1)
            toastBox(ownComment ? '評論已更新' : '評論已送出', 'success')
        } catch (error) {
            console.error('Failed to submit comment:', error)
            toastBox('評論失敗，請稍後再試', 'error')
        }
    }

    const runDelete = async (commentId: string) => {
        try {
            const result = await deleteCommentAction(commentId)
            if (!result.success) {
                toastBox(result.error ?? '刪除失敗，請稍後再試', 'error')
                return
            }

            // 刪掉評論等於也移除了它的評分，平均要跟著更新
            onRatingUpdate?.(postId, result.averageRating)
            // 重新取一次而不是在本地移除：軟刪除後這則可能消失（本人自刪）
            // 也可能變成墓碑（管理員下架），由伺服器決定比在前端猜可靠
            await fetchComments()
            if (editingId === commentId) setEditingId(null)
            toastBox('評論已刪除', 'success')
        } catch (error) {
            console.error('Failed to delete comment:', error)
            toastBox('刪除失敗，請稍後再試', 'error')
        }
    }

    const handleConfirm = async () => {
        if (!pending) return
        const action = pending
        setPending(null)

        if (action.type === 'delete') {
            await runDelete(action.commentId)
        } else {
            await runCreateOrEdit(action.content, action.rating)
        }
    }

    const dialog = pending ? DIALOG_COPY[pending.type] : null

    return (
        <div className="mt-8 border-t pt-6">
            <h3 className="mb-4 text-lg font-semibold">評論 ({comments.length})</h3>

            {isAuthenticated && isOwnRemoved && (
                <p className="mt-4 rounded-lg border border-input p-3 text-sm text-subtle">
                    你的評論因違反社群規範已被管理員隱藏，無法重新發表。
                </p>
            )}

            {showCreateForm && (
                <CommentForm
                    key={formKey}
                    initialRating={initialRating}
                    onSubmit={async (content, rating) =>
                        setPending({ type: 'create', content, rating })
                    }
                />
            )}

            {isLoading ? (
                <p className="py-4 text-center text-subtle">載入評論中...</p>
            ) : (
                <CommentList
                    comments={comments}
                    onDelete={(commentId) => {
                        const target = comments.find((c) => c._id === commentId)
                        setPending({
                            type: 'delete',
                            commentId,
                            isOthers: target?.userId !== currentUserId,
                        })
                    }}
                    editingId={editingId}
                    onEditStart={setEditingId}
                    onEditCancel={() => setEditingId(null)}
                    onEditSubmit={async (content, rating) =>
                        setPending({ type: 'edit', content, rating })
                    }
                />
            )}

            <ConfirmDialog
                open={pending !== null}
                title={dialog?.title ?? ''}
                description={
                    pending?.type === 'delete' && pending.isOthers
                        ? '你正以管理員身分刪除他人的評論，這個動作無法復原。'
                        : dialog?.description
                }
                confirmLabel={dialog?.confirmLabel}
                variant={dialog?.variant}
                onConfirm={handleConfirm}
                onCancel={() => setPending(null)}
            />
        </div>
    )
}

export default CommentSection
