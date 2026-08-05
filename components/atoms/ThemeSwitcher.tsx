'use client'

import { useTheme } from 'next-themes'
import { BsFillMoonStarsFill } from 'react-icons/bs'
import { MdSunny } from 'react-icons/md'

/**
 * 主題存在 localStorage／系統偏好，伺服器無從得知，所以「該畫太陽還是月亮」
 * 不能在 render 時用 JS 判斷 —— 那會 hydration mismatch，而常見的 mounted
 * 保險又會讓圖示延遲到掛載後才出現。
 *
 * 這裡改成兩個圖示都輸出，由 CSS 的 dark: 變體決定顯示哪一個。next-themes 會在
 * <head> 注入同步腳本，在首次繪製前就把 class 掛上 <html>，所以第一幀就是對的。
 * 伺服器與客戶端的輸出完全一致，也就沒有 mismatch。
 */
const ThemeSwitcher = () => {
    const { setTheme, resolvedTheme } = useTheme()

    return (
        <button
            type="button"
            aria-label="切換深淺色主題"
            className="cursor-pointer transition duration-300 hover:opacity-50"
            // resolvedTheme 只在點擊時讀取，不參與 render，因此不影響 hydration
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
            <MdSunny className="hidden dark:block" />
            <BsFillMoonStarsFill className="block dark:hidden" />
        </button>
    )
}

export default ThemeSwitcher
