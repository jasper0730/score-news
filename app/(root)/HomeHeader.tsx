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

    /*
     * 桌機版用 sticky 而不是 fixed。
     *
     * fixed 會讓 header 脫離文件流，內容區得自己補一段等高的 padding 讓位，
     * 那個高度只能寫死；一旦寫得跟實際高度不一樣，多了就在底下留一道縫、
     * 少了就蓋住內容，而這支 header 的高度會隨描述文字換行而變。
     * sticky 留在流裡，讓位由瀏覽器自己算，這個數字就不必存在了。
     *
     * 手機版維持 fixed：那裡只有上排 bar 要釘住，搜尋列與排序列要跟著捲走，
     * 整個 header 黏住會吃掉太多畫面。它的讓位量是 pt-home-mobile-nav。
     *
     * backdrop-blur 只留在 header 這層。`backdrop-filter` 不論定位與否都會
     * 建立 stacking context，內層 bar 也帶一份的話，從裡面垂下來的浮層
     * （使用者選單、日後的搜尋建議）z-index 就被關在那層裡出不去，會被
     * header 下緣的收邊蓋住——而且怎麼調大 z-index 都修不好。
     * 桌機版兩者高度一致，視覺上等價。
     */
    return (
        <header className="relative left-0 top-0 z-10 w-full bg-background/95 backdrop-blur-md md:sticky">
            <div className="fixed z-10 flex w-full items-start justify-between gap-5 bg-background/95 px-5 py-4 md:static">
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
