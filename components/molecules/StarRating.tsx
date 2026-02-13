'use client'

import { useState } from 'react'
import { FaStar } from 'react-icons/fa'

interface StarRatingProps {
    value: number
    onChange: (value: number) => void
    maxStars?: number
}

const StarRating = ({ value, onChange, maxStars = 5 }: StarRatingProps) => {
    const [hoverValue, setHoverValue] = useState(0)

    return (
        <div className="star-rating">
            {Array.from({ length: maxStars }, (_, index) => {
                const starValue = index + 1
                const isActive = (hoverValue || value) >= starValue

                return (
                    <FaStar
                        key={starValue}
                        className={`star-rating__star ${isActive ? 'star-rating__star--active' : 'star-rating__star--inactive'}`}
                        onMouseEnter={() => setHoverValue(starValue)}
                        onMouseLeave={() => setHoverValue(0)}
                        onClick={() => onChange(value === starValue ? 0 : starValue)}
                    />
                )
            })}
        </div>
    )
}

export default StarRating
