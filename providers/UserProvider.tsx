'use client'

import { getUser } from '@/actions/getUser'
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react'

export interface User {
    id: string
    image?: string
}

interface UserContextType {
    user: User | null
    setUser: (user: User) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = ({ children }: PropsWithChildren) => {
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        getUser().then((fetchedUser: User | null) => {
            if (fetchedUser) {
                setUser(fetchedUser)
            }
        })
    }, [])

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    )
}

export const useUser = () => {
    const context = useContext(UserContext)
    if (!context) {
        throw new Error('useUser 必須在 UserProvider 內使用')
    }
    return context
}
