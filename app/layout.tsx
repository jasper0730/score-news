import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import Providers from '@/providers/Providers'
import { getSession } from '@/actions/getUser'

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
    // 在最外層就把 session 解出來交給 SessionProvider，讓所有用到 useSession()
    // 的元件在首次 render 就拿到最終狀態，不會先渲染成未登入再跳掉
    const session = await getSession()

    return (
        <html lang="zh-TW" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans`}>
                <Providers session={session}>
                    <main className="flex min-h-dvh flex-col">{children}</main>
                </Providers>
            </body>
        </html>
    )
}
