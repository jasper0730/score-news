'use client'
import Link from 'next/link'
import SearchBar from '@/app/(root)/SearchBar'
import Logo from '@/components/ui/Logo'
import RegisterButton from '@/components/register/RegisterButton'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import SortButton from '@/app/(root)/SortButton'
import Avatars from '@/components/ui/Avatars'
import { useSession } from 'next-auth/react'

export type User = {
    id: string
    image?: string
} | null

const HomeHeader = () => {
    const currentUser = useSession()
    return (
        <div className="left-0 top-0 w-full bg-white z-10 dark:bg-black md:fixed md:shadow-md md:dark:border-b-2 md:dark:border-gray-500">
            <div className="px-5 py-5 flex justify-between items-start gap-5 fixed w-full z-10 bg-white dark:bg-black md:static md:pt-5 md:pb-0 shadow-md md:shadow-none dark:border-b-2 dark:border-gray-500 md:dark:border-none">
                <div>
                    <Link href="/" className="inline-block">
                        <Logo />
                    </Link>
                    <div className="max-w-[500px] w-full mt-5 h-[120px] overflow-auto hidden md:block">
                        是一個提供新聞瀏覽體驗的網站，特色包括評分、收藏、評論，讓讀者能夠更有互動性地參與新聞內容。
                        我們的目標是提升使用者的新聞閱讀體驗，使其更具個人化與社群互動性。
                    </div>
                </div>
                <SearchBar className="hidden max-w-[500px] md:flex" />
                <div className="flex items-center gap-2 md:gap-5 shrink-0">
                    {currentUser.status === 'authenticated' && (
                        <Link className="hover:opacity-70 duration-300" href="/dashboard">
                            後台
                        </Link>
                    )}
                    <RegisterButton
                        type={currentUser.status === 'authenticated' ? 'logout' : 'login'}
                    />
                    <ThemeSwitcher />
                    {currentUser.status === 'authenticated' && (
                        <div className="w-[35px] h-[35px] rounded-full relative">
                            <Avatars src={currentUser.data.user?.image} />
                        </div>
                    )}
                </div>
            </div>
            <div className="px-5 pt-[--navH] md:hidden md:pt-0 md:mt-3">
                <SearchBar className="" />
            </div>
            <div className="mt-3 px-5 w-full md:hidden">
                是一個提供新聞瀏覽體驗的網站，特色包括評分、收藏、評論，讓讀者能夠更有互動性地參與新聞內容。
                我們的目標是提升使用者的新聞閱讀體驗，使其更具個人化與社群互動性。
            </div>
            <div className="flex mt-5 px-5 justify-center md:justify-end">
                <SortButton type="rating" />
                <SortButton type="date" />
            </div>
        </div>
    )
}

export default HomeHeader
