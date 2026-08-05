'use client'

import Link from 'next/link'
import BrandLink from '@/components/molecules/BrandLink'
import ThemeSwitcher from '@/components/atoms/ThemeSwitcher'
import RegisterButton from '@/components/organisms/RegisterButton'
import Avatar from '@/components/atoms/Avatar'
import type { UserType } from '@/types/user'
import { IoArrowBack } from 'react-icons/io5'

interface NavBarProps {
    session: UserType | null
}

const NavBar = ({ session }: NavBarProps) => {
    return (
        <nav className="fixed left-0 top-0 z-10 flex w-full items-center justify-between border-b bg-background/95 px-5 py-3 shadow-sm backdrop-blur-md">
            <div className="flex items-center">
                <BrandLink />
            </div>
            <div className="flex items-center gap-4">
                {session && (
                    <Link
                        className="flex items-center gap-1 text-sm text-muted-foreground transition duration-300 hover:text-foreground"
                        href="/"
                    >
                        <IoArrowBack size={16} />
                        <span>前台</span>
                    </Link>
                )}
                <div className="h-5 w-px bg-border" />
                <RegisterButton type={session ? 'logout' : 'login'} />
                <ThemeSwitcher />
                {session && <Avatar src={session.image} size="md" />}
            </div>
        </nav>
    )
}

export default NavBar
