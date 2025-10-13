'use client'
import { getUser } from '@/actions/getUser'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'

export type User = {
    id: string
    image?: string
}

const UserContext = createContext<
    | {
          user: User | null
          setUser: (user: User) => void
      }
    | undefined
>(undefined)

export const UserProvider = ({ children }: PropsWithChildren) => {
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        getUser().then((user: User | null) => {
            if (user) {
                setUser(user)
            }
        })
    })

    return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>
}

export const useUser = () => {
    const context = useContext(UserContext)
    if (!context) {
        throw new Error('useUser 必須在 UserProvider 內使用')
    }
    return context
}
