'use client'

import Link from 'next/link'
import Logo from '@/components/atoms/Logo'
import ThemeSwitcher from '@/components/atoms/ThemeSwitcher'
import RegisterButton from '@/components/organisms/RegisterButton'
import Avatar from '@/components/atoms/Avatar'
import type { SessionType } from '@/app/types/SessionType'
import { IoArrowBack } from 'react-icons/io5'

interface NavBarProps {
    session: SessionType | null
}

const NavBar = ({ session }: NavBarProps) => {
    return (
        <nav className="flex justify-between items-center px-5 py-3 fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md z-10 shadow-sm dark:bg-black/95 dark:border-b dark:border-gray-800">
            <div className="flex items-center">
                <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 duration-300">
                    <Logo />
                    <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NewsScore</span>
                </Link>
            </div>
            <div className="flex items-center gap-4">
                {session && (
                    <Link className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 duration-300" href="/">
                        <IoArrowBack size={16} />
                        <span>前台</span>
                    </Link>
                )}
                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
                <RegisterButton type={session ? 'logout' : 'login'} />
                <ThemeSwitcher />
                {session && (
                    <Avatar src={session.image} size="md" />
                )}
            </div>
        </nav>
    )
}

export default NavBar
