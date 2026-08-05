import Link from 'next/link'
import Logo from '@/components/atoms/Logo'
import { cn } from '@/libs/cn'
import { BRAND_TEXT_CLASSES } from '@/libs/styles'

interface BrandLinkProps {
    /** 字樣在窄螢幕要不要隱藏（首頁 header 空間較緊） */
    hideTextOnMobile?: boolean
    className?: string
}

const BrandLink = ({ hideTextOnMobile = false, className }: BrandLinkProps) => {
    return (
        <Link
            href="/"
            aria-label="NewsScore 首頁"
            className={cn(
                'flex items-center gap-2.5 transition duration-300 hover:opacity-80',
                className
            )}
        >
            <Logo />
            <span className={cn(BRAND_TEXT_CLASSES, hideTextOnMobile && 'hidden sm:inline')}>
                NewsScore
            </span>
        </Link>
    )
}

export default BrandLink
