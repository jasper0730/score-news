'use client'

import { useState } from 'react'
import Button from '@/components/atoms/Button'
import StarRating from '@/components/molecules/StarRating'

interface CommentFormProps {
    initialRating?: number
    initialContent?: string
    onSubmit: (content: string, rating: number) => Promise<void>
}

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
                <span className="text-sm text-gray-500 shrink-0">評分</span>
                <StarRating value={rating} onChange={setRating} />
            </div>
            <textarea
                className="w-full p-3 border-2 rounded-lg resize-none focus:outline-none focus:border-blue-400 bg-transparent transition duration-300"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="寫下你的評論（選填）..."
                rows={3}
                maxLength={500}
            />
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{content.length}/500</span>
                <Button
                    className={`px-4 py-1.5 border rounded-md cursor-pointer ${isDisabled ? 'opacity-30 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
                    disabled={isDisabled}
                    onClick={handleSubmit}
                >
                    {isLoading ? '傳送中...' : initialRating > 0 ? '修改評論' : '送出評論'}
                </Button>
            </div>
        </div>
    )
}

export default CommentForm
