'use client'

import Image from 'next/image'

interface AvatarProps {
    src?: string | null
    size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
    sm: 'avatar--sm',
    md: 'avatar--md',
    lg: 'avatar--lg',
}

const Avatar = ({ src, size = 'md' }: AvatarProps) => {
    return (
        <div className={`avatar ${SIZE_CLASSES[size]}`}>
            <Image
                alt="使用者頭像"
                className="avatar__image"
                src={src ?? '/images/placeholder.jpg'}
                fill
                priority
            />
        </div>
    )
}

export default Avatar
