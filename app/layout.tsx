import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import Providers from '@/providers/Providers'

// 不指定 weight 會載入 variable font，一份檔案涵蓋 100–900。
// 過去固定成 weight: '100'，導致拉丁字母與數字全部是 Thin，
// 而且 font-bold 只能由瀏覽器合成假粗體。
const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
})

export const metadata: Metadata = {
    title: {
        template: '%s | Score News',
        default: 'Score News',
    },
    description: 'Score! please.',
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="zh-TW" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans`}>
                <Providers>
                    <main className="flex min-h-dvh flex-col">{children}</main>
                </Providers>
            </body>
        </html>
    )
}
