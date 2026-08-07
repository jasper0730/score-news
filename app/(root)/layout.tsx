import HomeHeader from '@/app/(root)/HomeHeader'

export default async function Layout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <>
            <HomeHeader />
            {/* flex-1 讓內容區補滿視窗剩下的高度。root layout 的 main 是
                min-h-dvh 的 flex column，交給它算就不必再寫死任何高度 */}
            <section className="flex-1">{children}</section>
        </>
    )
}
