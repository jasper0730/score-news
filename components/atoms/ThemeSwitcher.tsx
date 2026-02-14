'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { BsFillMoonStarsFill } from 'react-icons/bs'
import { MdSunny } from 'react-icons/md'

const ThemeSwitcher = () => {
    const [mounted, setMounted] = useState(false)
    const { setTheme, resolvedTheme } = useTheme()

    useEffect(() => setMounted(true), [])

    if (!mounted) {
        return (
            <div className="relative w-4">
                <Image
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAC/ghZPgAAAAAASUVORK5CYII="
                    alt="主題佔位圖"
                    fill
                    style={{ objectFit: 'contain' }}
                    className="pointer-events-none select-none"
                />
            </div>
        )
    }

    const iconClass = 'hover:opacity-50 duration-300 cursor-pointer'

    if (resolvedTheme === 'dark') {
        return <MdSunny className={iconClass} onClick={() => setTheme('light')} />
    }

    return <BsFillMoonStarsFill className={iconClass} onClick={() => setTheme('dark')} />
}

export default ThemeSwitcher
