'use client'

import Link from 'next/link'
import SearchBar from '@/components/molecules/SearchBar'
import Logo from '@/components/atoms/Logo'
import RegisterButton from '@/components/organisms/RegisterButton'
import ThemeSwitcher from '@/components/atoms/ThemeSwitcher'
import SortDropdown from '@/components/molecules/SortDropdown'
import Avatar from '@/components/atoms/Avatar'
import { useSession } from 'next-auth/react'
import { MdDashboard } from 'react-icons/md'

const HomeHeader = () => {
    const { status, data: session } = useSession()
    const isAuthenticated = status === 'authenticated'

    return (
        <header className="left-0 top-0 w-full bg-white/95 backdrop-blur-md z-10 dark:bg-black/95 md:fixed md:shadow-sm md:dark:border-b md:dark:border-gray-800">
            <div className="px-5 py-4 flex justify-between items-start gap-5 fixed w-full z-10 bg-white/95 backdrop-blur-md dark:bg-black/95 md:static shadow-sm md:shadow-none dark:border-b dark:border-gray-800 md:dark:border-none">
                <div className="flex flex-col gap-1 shrink-0">
                    <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 duration-300">
                        <Logo />
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:inline">NewsScore</span>
                    </Link>
                    <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[280px] hidden md:block">
                        新聞評分、收藏、評論平台 — 讓閱讀更有互動性
                    </p>
                </div>
                <SearchBar className="hidden max-w-[500px] md:flex" />
                <div className="flex items-center gap-3 md:gap-4 shrink-0">
                    {isAuthenticated && (
                        <Link className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 duration-300" href="/dashboard" title="後台管理">
                            <MdDashboard size={20} />
                            <span className="hidden sm:inline">後台</span>
                        </Link>
                    )}
                    <RegisterButton type={isAuthenticated ? 'logout' : 'login'} />
                    <ThemeSwitcher />
                    {isAuthenticated && (
                        <Link href="/dashboard" className="hover:opacity-80 duration-300">
                            <Avatar src={session?.user?.image} size="md" />
                        </Link>
                    )}
                </div>
            </div>
            <div className="px-5 pt-[--navH] md:hidden md:pt-0 md:mt-3">
                <SearchBar />
            </div>
            <div className="flex mt-3 px-5 pb-2 justify-center md:justify-end">
                <SortDropdown />
            </div>
        </header>
    )
}

export default HomeHeader
