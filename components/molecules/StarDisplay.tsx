'use client'

import { FaStar } from 'react-icons/fa'

interface StarDisplayProps {
    rating: number
}

const StarDisplay = ({ rating }: StarDisplayProps) => {
    if (!rating || rating <= 0) return null

    return (
        <div
            className="mt-4 flex items-center"
            role="img"
            aria-label={`評分 ${Math.round(rating)} 顆星`}
        >
            {Array.from({ length: Math.round(rating) }, (_, index) => (
                <FaStar key={index} className="text-xl text-star" />
            ))}
        </div>
    )
}

export default StarDisplay
