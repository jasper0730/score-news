'use client'

import { useState } from 'react'
import { toastBox } from '@/utils/toast'
import { rateNewsAction } from '@/actions/rateNewsAction'
import StarRating from '@/components/molecules/StarRating'
import Button from '@/components/atoms/Button'

interface RatingFormProps {
    postId: string | undefined
    initialRating?: number
    onRatingUpdate: (postId: string, newRating: number) => void
}

const RatingForm = ({ postId, initialRating = 0, onRatingUpdate }: RatingFormProps) => {
    const [rating, setRating] = useState(initialRating)
    const [submitted, setSubmitted] = useState(initialRating > 0)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async () => {
        if (!postId || rating === 0) return

        setIsLoading(true)
        try {
            const result = await rateNewsAction(postId, rating)

            if (result.success) {
                toastBox('評分已送出', 'success')
                setSubmitted(true)
                onRatingUpdate(postId, result.rate)
            } else {
                throw new Error('Failed to update rating')
            }
        } catch (error) {
            console.error(error)
            toastBox('操作異常，請稍後再試', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const isDisabled = isLoading || rating === 0

    return (
        <div>
            <h3 className="text-lg font-semibold mb-2">你覺得這則新聞？</h3>
            <div className="flex items-center gap-5">
                <StarRating value={rating} onChange={setRating} />
                {submitted ? (
                    <span className="text-sm text-green-500">已評分</span>
                ) : (
                    <Button
                        className={`px-2 py-1 border rounded-md w-[100px] cursor-pointer ${isDisabled ? 'opacity-30 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
                        disabled={isDisabled}
                        onClick={handleSubmit}
                    >
                        {isLoading ? '傳送中...' : '傳送評分'}
                    </Button>
                )}
            </div>
        </div>
    )
}

export default RatingForm
