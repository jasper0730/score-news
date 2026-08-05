'use client'

import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'

interface NextAuthProviderProps {
    children: React.ReactNode
    /** 伺服器端解析好的 session。有給的話 useSession() 首次 render 就是最終狀態，
     *  不會經過 status === 'loading'，畫面也就不會先閃一次未登入的樣子。 */
    session: Session | null
}

const NextAuthProvider = ({ children, session }: NextAuthProviderProps) => {
    return <SessionProvider session={session}>{children}</SessionProvider>
}

export default NextAuthProvider
