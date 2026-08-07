'use client'

import BrandLink from '@/components/molecules/BrandLink'
import ThemeSwitcher from '@/components/atoms/ThemeSwitcher'
import RegisterButton from '@/components/organisms/RegisterButton'
import UserMenu from '@/components/molecules/UserMenu'
import { HEADER_FADE_CLASSES } from '@/libs/styles'
import type { UserType } from '@/types/user'

interface NavBarProps {
    session: UserType | null
}

const NavBar = ({ session }: NavBarProps) => {
    return (
        <nav className="fixed left-0 top-0 z-10 flex w-full items-center justify-between bg-background/95 px-5 py-3 backdrop-blur-md">
            <div className="flex items-center">
                <BrandLink />
            </div>
            <div className="flex items-center gap-3 md:gap-4">
                <ThemeSwitcher />
                {/* 與前台一致：「前往前台」與「登出」都收進頭像下拉，未登入時只留登入鈕 */}
                {session ? (
                    <UserMenu image={session.image} navTarget="home" />
                ) : (
                    <RegisterButton type="login" />
                )}
            </div>
            {/* 後台目前只有 dashboard，它的分頁列會整片蓋住這條收邊，
                改由分頁列自己帶一條。這裡留著是給日後沒有分頁列的頁面 */}
            <div className={HEADER_FADE_CLASSES} aria-hidden />
        </nav>
    )
}

export default NavBar
