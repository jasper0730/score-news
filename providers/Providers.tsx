import { ReactNode } from 'react'
import { ThemeProvider } from './ThemeProvider'
import ToasterProvider from './ToastProvider'
import SessionProvider from './SessionProvider'
import type { Session } from 'next-auth'

type ProvidersProps = {
    children: ReactNode
    session: Session | null
}

const Providers = ({ children, session }: ProvidersProps) => {
    return (
        <SessionProvider session={session}>
            <ToasterProvider />
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {children}
            </ThemeProvider>
        </SessionProvider>
    )
}

export default Providers
