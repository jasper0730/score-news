import type { Metadata } from 'next'
import { Oswald, Inter } from 'next/font/google'
import '../styles/globals.css'
import Providers from '@/providers/Providers'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    weight: '100',
})
const oswald = Oswald({
    subsets: ['latin'],
    variable: '--font-oswald',
    weight: '400',
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
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} ${oswald.variable}`}>
                <Providers>
                    <main className="h-[100dvh] flex flex-col">{children}</main>
                </Providers>
            </body>
        </html>
    )
}
