'use client'

import { FaStar } from 'react-icons/fa'

interface StarDisplayProps {
    rating: number
}

const StarDisplay = ({ rating }: StarDisplayProps) => {
    if (!rating || rating <= 0) return null

    return (
        <div className="star-display">
            {Array.from({ length: Math.round(rating) }, (_, index) => (
                <FaStar key={index} className="star-display__star" />
            ))}
        </div>
    )
}

export default StarDisplay
