'use client'

import { useState } from 'react'
import { toastBox } from '@/utils/toast'
import axios from 'axios'
import StarRating from '@/components/molecules/StarRating'
import Button from '@/components/atoms/Button'

interface RatingFormProps {
    postId: string | undefined
    onRatingUpdate: (postId: string, newRating: number) => void
}

const RatingForm = ({ postId, onRatingUpdate }: RatingFormProps) => {
    const [rating, setRating] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async () => {
        if (!postId || rating === 0) return

        setIsLoading(true)
        try {
            const res = await axios.post('/api/rating', { id: postId, rate: rating })
            const { data } = res

            if (data.state === 'success') {
                toastBox('評分已送出', 'success')
                onRatingUpdate(postId, data.rate)
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
        <div className="rating-form">
            <h3 className="rating-form__title">你覺得這則新聞？</h3>
            <div className="rating-form__controls">
                <StarRating value={rating} onChange={setRating} />
                <Button
                    className={`rating-form__submit ${isDisabled ? 'rating-form__submit--disabled' : ''}`}
                    disabled={isDisabled}
                    onClick={handleSubmit}
                >
                    {isLoading ? '傳送中...' : '傳送評分'}
                </Button>
            </div>
        </div>
    )
}

export default RatingForm
