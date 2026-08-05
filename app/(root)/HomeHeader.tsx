'use client'

import SearchBar from '@/components/molecules/SearchBar'
import BrandLink from '@/components/molecules/BrandLink'
import UserMenu from '@/components/molecules/UserMenu'
import RegisterButton from '@/components/organisms/RegisterButton'
import ThemeSwitcher from '@/components/atoms/ThemeSwitcher'
import SortDropdown from '@/components/molecules/SortDropdown'
import { useSession } from 'next-auth/react'

const HomeHeader = () => {
    const { status, data: session } = useSession()
    const isAuthenticated = status === 'authenticated'

    return (
        <header className="left-0 top-0 z-10 w-full bg-background/95 backdrop-blur-md md:fixed md:border-b md:shadow-sm">
            <div className="fixed z-10 flex w-full items-start justify-between gap-5 border-b bg-background/95 px-5 py-4 shadow-sm backdrop-blur-md md:static md:border-none md:shadow-none">
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
            </div>
            <div className="px-5 pt-nav md:mt-3 md:hidden md:pt-0">
                <SearchBar />
            </div>
            <div className="mt-3 flex justify-center px-5 pb-2 md:justify-end">
                <SortDropdown />
            </div>
        </header>
    )
}

export default HomeHeader
