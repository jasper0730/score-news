'use client'

import SearchBar from '@/components/molecules/SearchBar'
import BrandLink from '@/components/molecules/BrandLink'
import UserMenu from '@/components/molecules/UserMenu'
import RegisterButton from '@/components/organisms/RegisterButton'
import ThemeSwitcher from '@/components/atoms/ThemeSwitcher'
import SortDropdown from '@/components/molecules/SortDropdown'
import { HEADER_FADE_CLASSES } from '@/libs/styles'
import { cn } from '@/libs/cn'
import { useSession } from 'next-auth/react'

const HomeHeader = () => {
    const { status, data: session } = useSession()
    const isAuthenticated = status === 'authenticated'

    return (
        <header className="relative left-0 top-0 z-10 w-full bg-background/95 backdrop-blur-md md:fixed">
            <div className="fixed z-10 flex w-full items-start justify-between gap-5 bg-background/95 px-5 py-4 backdrop-blur-md md:static">
                <div className="flex shrink-0 flex-col gap-1">
                    <BrandLink hideTextOnMobile />
                    <p className="hidden max-w-[280px] text-xs text-subtle md:block">
                        新聞評分、收藏、評論平台 — 讓閱讀更有互動性
                    </p>
                </div>
                <SearchBar className="hidden max-w-[500px] md:flex" />
                <div className="flex shrink-0 items-center gap-3 md:gap-4">
                    <ThemeSwitcher />
                    {/* 登入後「前往後台」與「登出」都收進頭像下拉，未登入時只留登入鈕 */}
                    {isAuthenticated ? (
                        <UserMenu image={session?.user?.image} />
                    ) : (
                        <RegisterButton type="login" />
                    )}
                </div>
                {/* 手機版收邊掛在這層：此時只有這條 bar 是固定的，
                    外層 header 會跟著頁面往上捲 */}
                <div className={cn(HEADER_FADE_CLASSES, 'md:hidden')} aria-hidden />
            </div>
            <div className="px-5 pt-home-mobile-nav md:mt-3 md:hidden md:pt-0">
                <SearchBar />
            </div>
            <div className="mt-3 flex justify-center px-5 pb-2 md:justify-end">
                <SortDropdown />
            </div>
            {/* 桌機版整個 header（含搜尋列與排序列）才是固定的，收邊掛最外層 */}
            <div className={cn(HEADER_FADE_CLASSES, 'hidden md:block')} aria-hidden />
        </header>
    )
}

export default HomeHeader
