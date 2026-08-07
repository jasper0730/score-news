'use client'

import { useState } from 'react'
import Button from '@/components/atoms/Button'
import Textarea from '@/components/atoms/Textarea'
import StarRating from '@/components/molecules/StarRating'

interface CommentFormProps {
    initialRating?: number
    initialContent?: string
    onSubmit: (content: string, rating: number) => Promise<void>
    /** 有值時顯示取消鈕。列表裡的行內編輯需要退出的方法 */
    onCancel?: () => void
    submitLabel?: string
}

const MAX_LENGTH = 500

const CommentForm = ({
    initialRating = 0,
    initialContent = '',
    onSubmit,
    onCancel,
    submitLabel,
}: CommentFormProps) => {
    const [content, setContent] = useState(initialContent)
    const [rating, setRating] = useState(initialRating)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async () => {
        if (isLoading || rating === 0) return

        setIsLoading(true)
        try {
            await onSubmit(content.trim(), rating)
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const isDisabled = isLoading || rating === 0
    // 帶著 initialRating 進來代表這篇已經評論過，這次是修改而非新增
    const defaultLabel = initialRating > 0 ? '修改評論' : '送出評論'
    const buttonLabel = submitLabel ?? defaultLabel

    return (
        <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <span className="shrink-0 text-sm text-muted-foreground">評分</span>
                <StarRating value={rating} onChange={setRating} />
            </div>
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="寫下你的評論（選填）..."
                rows={3}
                maxLength={MAX_LENGTH}
                aria-label="評論內容"
            />
            <div className="flex items-center justify-between">
                <span className="text-sm tabular-nums text-subtle">
                    {content.length}/{MAX_LENGTH}
                </span>
                <div className="flex items-center gap-2">
                    {onCancel && (
                        <Button variant="outline" size="sm" onClick={onCancel} disabled={isLoading}>
                            取消
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" disabled={isDisabled} onClick={handleSubmit}>
                        {isLoading ? '傳送中...' : buttonLabel}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default CommentForm
