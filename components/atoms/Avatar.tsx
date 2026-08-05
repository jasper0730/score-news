'use client'

import Image from 'next/image'
import { cn } from '@/libs/cn'

type AvatarSize = 'sm' | 'md' | 'lg'

interface AvatarProps {
    src?: string | null
    size?: AvatarSize
    className?: string
    /**
     * 只有首屏、確定會立刻看到的頭像才該開（例如 header）。
     * 預設關閉：評論列表裡每則留言都有頭像，全部標成高優先級會與
     * 真正的 LCP 圖片搶頻寬，也失去延遲載入的效果。
     */
    priority?: boolean
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
    sm: 'h-6 w-6',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
}

/** Image 的 sizes 要對得上實際渲染尺寸，否則 next/image 會抓最大的斷點下載 */
const SIZE_HINTS: Record<AvatarSize, string> = {
    sm: '24px',
    md: '36px',
    lg: '48px',
}

const Avatar = ({ src, size = 'md', className, priority = false }: AvatarProps) => {
    return (
        <div className={cn('relative overflow-hidden rounded-full', SIZE_CLASSES[size], className)}>
            <Image
                alt="使用者頭像"
                className="object-cover"
                src={src || '/images/placeholder.jpg'}
                sizes={SIZE_HINTS[size]}
                fill
                priority={priority}
            />
        </div>
    )
}

export default Avatar
