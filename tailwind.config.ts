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
                star: {
                    DEFAULT: token('star'),
                    foreground: token('star-foreground'),
                },
                // Modal 遮罩：日夜都是暗的，所以不跟著 foreground 反轉
                scrim: token('scrim'),
                brand: {
                    from: token('brand-from'),
                    to: token('brand-to'),
                },
                /* 第三方登入的識別色。刻意降彩度，否則三顆飽和按鈕會打斷
                   整體低調的調性；仍保留各家可辨識的色相。 */
                social: {
                    facebook: '#4A6B8A',
                    google: '#A15B4E',
                    github: '#4A4843',
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
                // 手機版首頁的上排 bar 比後台 NavBar 高，另開一個
                'home-mobile-nav': 'var(--home-mobile-nav-height)',
                // 首頁 header 較高（多了搜尋列與排序列）
                'home-nav': 'var(--home-nav-height)',
            },
            /* Inter 只含拉丁字符，中文會逐字 fallback。
               不明確指定中文字體的話，各平台挑到的字型不一致（Windows 常落到
               新細明體），跟 Inter 併排時粗細與字面大小都對不起來。 */
            fontFamily: {
                sans: [
                    'var(--font-inter)',
                    'PingFang TC',
                    'Microsoft JhengHei',
                    'Noto Sans TC',
                    'Hiragino Sans',
                    'system-ui',
                    'sans-serif',
                ],
            },
            /* 行高放寬給中文用。Tailwind 預設是為拉丁文調的（text-sm 是 14/20），
               中文字面大、沒有 x-height 的視覺留白，同樣行高會顯得擁擠。 */
            fontSize: {
                xs: ['0.75rem', { lineHeight: '1.25rem' }],
                sm: ['0.875rem', { lineHeight: '1.5rem' }],
                base: ['1rem', { lineHeight: '1.75rem' }],
                lg: ['1.125rem', { lineHeight: '1.875rem' }],
                xl: ['1.25rem', { lineHeight: '2rem' }],
                '2xl': ['1.5rem', { lineHeight: '2.25rem' }],
                '3xl': ['1.875rem', { lineHeight: '2.5rem' }],
                '4xl': ['2.25rem', { lineHeight: '2.75rem' }],
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
