import { options } from '@/app/api/auth/[...nextauth]/options'
import { getServerSession } from 'next-auth'
import clientPromise from '@/libs/mongodb'

export const getSession = async () => {
    return await getServerSession(options)
}

export const getUser = async () => {
    try {
        const session = await getSession()
        if (!session?.user?.email) return null

        // 連接到 database
        const client = await clientPromise
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
