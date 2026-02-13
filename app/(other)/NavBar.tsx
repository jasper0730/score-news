'use client'

import Link from 'next/link'
import Logo from '@/components/atoms/Logo'
import ThemeSwitcher from '@/components/atoms/ThemeSwitcher'
import RegisterButton from '@/components/organisms/RegisterButton'
import Avatar from '@/components/atoms/Avatar'
import type { SessionType } from '@/app/types/SessionType'

interface NavBarProps {
    session: SessionType | null
}

const NavBar = ({ session }: NavBarProps) => {
    return (
        <nav className="nav-bar">
            <Link href="/" className="inline-block">
                <Logo />
            </Link>
            <div className="nav-bar__actions">
                {session && (
                    <Link className="nav-bar__link" href="/">
                        前台
                    </Link>
                )}
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
