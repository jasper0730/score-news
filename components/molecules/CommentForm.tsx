'use client'

import { useState } from 'react'
import Button from '@/components/atoms/Button'

interface CommentFormProps {
    onSubmit: (content: string) => Promise<void>
}

const CommentForm = ({ onSubmit }: CommentFormProps) => {
    const [content, setContent] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async () => {
        if (!content.trim() || isLoading) return

        setIsLoading(true)
        try {
            await onSubmit(content.trim())
            setContent('')
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

    const isDisabled = isLoading || !content.trim()

    return (
        <div className="mt-4">
            <textarea
                className="w-full p-3 border-2 rounded-lg resize-none focus:outline-none focus:border-blue-400 bg-transparent transition duration-300"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="寫下你的評論..."
                rows={3}
                maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-400">
                    {content.length}/500
                </span>
                <Button
                    className={`px-4 py-1.5 border rounded-md cursor-pointer ${isDisabled ? 'opacity-30 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
                    disabled={isDisabled}
                    onClick={handleSubmit}
                >
                    {isLoading ? '傳送中...' : '送出評論'}
                </Button>
            </div>
        </div>
    )
}

export default CommentForm
