import { cache } from 'react'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { getServerSession } from 'next-auth'
import getMongoClient from '@/libs/mongodb'

export interface UserType {
    id: string
    name?: string
    email?: string
    image?: string
    nickname?: string
    bio?: string
}

// layout 與 page 會在同一次 render 中各自呼叫，用 cache() 去重，
// 同一個 request 內只實際解析一次 session
export const getSession = cache(async () => {
    return await getServerSession(options)
})

export const getUser = async (): Promise<UserType | null> => {
    try {
        const session = await getSession()
        console.log('[getUser] session:', session ? `email=${session.user?.email}` : 'NULL')
        if (!session?.user?.email) return null

        // 連接到 database
        const client = await getMongoClient()
        const db = client.db()
        const usersCollection = db.collection('users')

        const currentUser = await usersCollection.findOne({
            email: session.user.email,
        })
        if (!currentUser) return null

        const { _id, ...safeUser } = currentUser
        return {
            id: _id.toString(),
            ...safeUser,
        }
    } catch (error) {
        if (error instanceof Error) {
            return null
        }
        return null
    }
}
