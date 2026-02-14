'use client'

import { FaStar } from 'react-icons/fa'

interface StarDisplayProps {
    rating: number
}

const StarDisplay = ({ rating }: StarDisplayProps) => {
    if (!rating || rating <= 0) return null

    return (
        <div className="flex items-center mt-4">
            {Array.from({ length: Math.round(rating) }, (_, index) => (
                <FaStar key={index} className="text-yellow-500 text-xl" />
            ))}
        </div>
    )
}

export default StarDisplay
