'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { AnimatePresence, motion } from 'motion/react'
import { MdDashboard, MdHome } from 'react-icons/md'
import { RiLogoutBoxLine } from 'react-icons/ri'
import Avatar from '@/components/atoms/Avatar'

/**
 * 選單裡的導覽項目要指向哪裡。
 * 前台 header 指向後台，後台 header 指向前台——兩邊互為對方的去處。
 */
type NavTarget = 'dashboard' | 'home'

interface UserMenuProps {
    image?: string | null
    navTarget?: NavTarget
}

const NAV_ITEMS: Record<NavTarget, { href: string; label: string; Icon: typeof MdDashboard }> = {
    dashboard: { href: '/dashboard', label: '前往後台', Icon: MdDashboard },
    home: { href: '/', label: '前往前台', Icon: MdHome },
}

const ITEM_CLASSES =
    'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors duration-200 hover:bg-muted'

const UserMenu = ({ image, navTarget = 'dashboard' }: UserMenuProps) => {
    const { href, label, Icon } = NAV_ITEMS[navTarget]
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (!open) return

        // 點到選單以外的地方就收起。用 mousedown 而非 click，
        // 這樣按住拖曳到選單外放開也算關閉。
        const handlePointerDown = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false)
                // 焦點還給觸發按鈕，鍵盤使用者才不會掉到頁面開頭
                triggerRef.current?.focus()
            }
        }

        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [open])

    return (
        <div ref={containerRef} className="relative">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="開啟使用者選單"
                className="block rounded-full transition duration-300 hover:opacity-80"
            >
                <Avatar src={image} size="md" priority />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        role="menu"
                        aria-label="使用者選單"
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        // origin-top-right 讓縮放從頭像那一角展開，而不是從中心脹大
                        className="absolute right-0 top-full z-20 mt-2 w-36 origin-top-right overflow-hidden rounded-lg border bg-surface py-1 shadow-lg"
                    >
                        <Link
                            role="menuitem"
                            href={href}
                            onClick={() => setOpen(false)}
                            className={ITEM_CLASSES}
                        >
                            <Icon size={16} />
                            <span>{label}</span>
                        </Link>
                        <button
                            role="menuitem"
                            type="button"
                            className={ITEM_CLASSES}
                            onClick={() => {
                                setOpen(false)
                                signOut({ callbackUrl: '/' })
                            }}
                        >
                            <RiLogoutBoxLine size={16} />
                            <span>登出</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default UserMenu
