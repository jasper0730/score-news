'use client'

import { useState } from 'react'
import Button from '@/components/atoms/Button'
import Textarea from '@/components/atoms/Textarea'
import StarRating from '@/components/molecules/StarRating'

interface CommentFormProps {
    initialRating?: number
    initialContent?: string
    onSubmit: (content: string, rating: number) => Promise<void>
}

const MAX_LENGTH = 500

const CommentForm = ({ initialRating = 0, initialContent = '', onSubmit }: CommentFormProps) => {
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
                <span className="text-sm text-subtle">
                    {content.length}/{MAX_LENGTH}
                </span>
                <Button variant="ghost" size="sm" disabled={isDisabled} onClick={handleSubmit}>
                    {isLoading ? '傳送中...' : initialRating > 0 ? '修改評論' : '送出評論'}
                </Button>
            </div>
        </div>
    )
}

export default CommentForm
