'use client'

import Link from 'next/link'
import SearchBar from '@/components/molecules/SearchBar'
import Logo from '@/components/atoms/Logo'
import RegisterButton from '@/components/organisms/RegisterButton'
import ThemeSwitcher from '@/components/atoms/ThemeSwitcher'
import SortButton from '@/components/molecules/SortButton'
import Avatar from '@/components/atoms/Avatar'
import { useSession } from 'next-auth/react'

const HomeHeader = () => {
    const { status, data: session } = useSession()
    const isAuthenticated = status === 'authenticated'

    return (
        <div className="home-header">
            <div className="home-header__top">
                <div>
                    <Link href="/" className="inline-block">
                        <Logo />
                    </Link>
                    <div className="home-header__brand-description">
                        是一個提供新聞瀏覽體驗的網站，特色包括評分、收藏、評論，讓讀者能夠更有互動性地參與新聞內容。
                        我們的目標是提升使用者的新聞閱讀體驗，使其更具個人化與社群互動性。
                    </div>
                </div>
                <SearchBar className="hidden max-w-[500px] md:flex" />
                <div className="home-header__actions">
                    {isAuthenticated && (
                        <Link className="home-header__dashboard-link" href="/dashboard">
                            後台
                        </Link>
                    )}
                    <RegisterButton type={isAuthenticated ? 'logout' : 'login'} />
                    <ThemeSwitcher />
                    {isAuthenticated && (
                        <Avatar src={session?.user?.image} size="md" />
                    )}
                </div>
            </div>
            <div className="home-header__mobile-search">
                <SearchBar />
            </div>
            <div className="home-header__mobile-description">
                是一個提供新聞瀏覽體驗的網站，特色包括評分、收藏、評論，讓讀者能夠更有互動性地參與新聞內容。
                我們的目標是提升使用者的新聞閱讀體驗，使其更具個人化與社群互動性。
            </div>
            <div className="home-header__sort-bar">
                <SortButton type="rating" />
                <SortButton type="date" />
            </div>
        </div>
    )
}

export default HomeHeader
