'use client'

import Image from 'next/image'

interface AvatarProps {
    src?: string | null
    size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
    sm: 'w-[25px] h-[25px]',
    md: 'w-[35px] h-[35px]',
    lg: 'w-[50px] h-[50px]',
}

const Avatar = ({ src, size = 'md' }: AvatarProps) => {
    return (
        <div className={`rounded-full relative overflow-hidden ${SIZE_CLASSES[size]}`}>
            <Image
                alt="使用者頭像"
                className="rounded-full object-cover"
                src={src || '/images/placeholder.jpg'}
                fill
                priority
            />
        </div>
    )
}

export default Avatar
