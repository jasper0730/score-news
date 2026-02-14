'use client'

import { useState } from 'react'
import { RiLoginBoxLine, RiLogoutBoxLine } from 'react-icons/ri'
import { AnimatePresence } from 'motion/react'
import { signOut } from 'next-auth/react'
import RegisterModal from '@/components/organisms/RegisterModal'
import type { AuthFormType } from '@/types/news'

interface RegisterButtonProps {
    type: 'login' | 'logout'
}

const RegisterButton = ({ type }: RegisterButtonProps) => {
    const [openModal, setOpenModal] = useState<AuthFormType | null>(null)

    const handleLoginOpen = () => {
        setOpenModal('login')
    }

    const handleClose = () => {
        setOpenModal(null)
    }

    if (type === 'logout') {
        return (
            <button
                className="flex gap-1 cursor-pointer items-center hover:opacity-70 duration-300"
                onClick={() => signOut({ callbackUrl: '/' })}
                type="button"
            >
                <RiLogoutBoxLine size="1rem" />
                <span>登出</span>
            </button>
        )
    }

    return (
        <>
            <button
                className="flex gap-1 cursor-pointer items-center hover:opacity-70 duration-300"
                onClick={handleLoginOpen}
                type="button"
            >
                <RiLoginBoxLine size="1rem" />
                <span>登入</span>
            </button>

            <AnimatePresence>
                {openModal === 'login' && (
                    <RegisterModal
                        open
                        onClose={handleClose}
                        type="login"
                        setOpenModal={setOpenModal}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {openModal === 'signup' && (
                    <RegisterModal
                        open
                        onClose={handleClose}
                        type="signup"
                        setOpenModal={setOpenModal}
                    />
                )}
            </AnimatePresence>
        </>
    )
}

export default RegisterButton
