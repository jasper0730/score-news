'use client'

import BrandLink from '@/components/molecules/BrandLink'
import ThemeSwitcher from '@/components/atoms/ThemeSwitcher'
import RegisterButton from '@/components/organisms/RegisterButton'
import UserMenu from '@/components/molecules/UserMenu'
import type { UserType } from '@/types/user'

interface NavBarProps {
    session: UserType | null
}

const NavBar = ({ session }: NavBarProps) => {
    return (
        <nav className="fixed left-0 top-0 z-10 flex w-full items-center justify-between border-b bg-background/95 px-5 py-3 shadow-sm backdrop-blur-md">
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
        </nav>
    )
}

export default NavBar
