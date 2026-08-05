import type { Config } from 'tailwindcss'

/**
 * 顏色一律走 CSS 變數，變數本身只存 RGB 三個數字（例如 `255 255 255`），
 * 這樣 `bg-card/50`、`text-foreground/70` 這種透明度修飾語才能正常運作。
 * 淺色／深色的實際值定義在 styles/globals.css。
 */
const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`

export default {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './utils/**/*.{js,ts,jsx,tsx,mdx}',
        // libs/styles.ts 存放共用的 class 字串，沒掃到會被 purge 掉
        './libs/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // 頁面底色與主要文字
                background: token('background'),
                foreground: token('foreground'),
                // 浮在頁面之上的面板：Modal、下拉選單
                surface: token('surface'),
                // 卡片、留言區塊等次要區塊底色
                card: token('card'),
                // 弱化的底色（例如未選取的排序按鈕）
                muted: {
                    DEFAULT: token('muted'),
                    foreground: token('muted-foreground'),
                },
                // 再更弱一階的文字：時間戳、字數統計
                subtle: token('subtle'),
                border: token('border'),
                input: token('input'),
                ring: token('ring'),
                primary: {
                    DEFAULT: token('primary'),
                    foreground: token('primary-foreground'),
                },
                danger: token('danger'),
                success: token('success'),
                star: token('star'),
                brand: {
                    from: token('brand-from'),
                    to: token('brand-to'),
                },
            },
            // 讓沒有指定顏色的 `border` / `border-b` 直接吃語意化邊框色，
            // 免得每個地方都要補一次 dark:border-gray-700
            borderColor: {
                DEFAULT: token('border'),
            },
            ringColor: {
                DEFAULT: token('ring'),
            },
            spacing: {
                // 固定導覽列高度，供內容區塊讓位使用
                nav: 'var(--nav-height)',
                // 首頁 header 較高（多了搜尋列與排序列）
                'home-nav': 'var(--home-nav-height)',
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                display: ['var(--font-oswald)', 'system-ui', 'sans-serif'],
            },
            keyframes: {
                // react-hot-toast 自訂 toast 的進退場動畫
                enter: {
                    from: { opacity: '0', transform: 'translateY(-8px) scale(0.96)' },
                    to: { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
                leave: {
                    from: { opacity: '1', transform: 'translateY(0) scale(1)' },
                    to: { opacity: '0', transform: 'translateY(-8px) scale(0.96)' },
                },
            },
            animation: {
                enter: 'enter 200ms ease-out',
                leave: 'leave 150ms ease-in forwards',
            },
        },
    },
    plugins: [],
} satisfies Config
