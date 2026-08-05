import { cache } from 'react'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { getCollection, type UserDocument } from '@/libs/db'
import type { UserType } from '@/types/user'

export type { UserType }

// layout 與 page 會在同一次 render 中各自呼叫，用 cache() 去重，
// 同一個 request 內只實際解析一次 session
export const getSession = cache(async () => {
    return await getServerSession(options)
})

export const getUser = cache(async (): Promise<UserType | null> => {
    try {
        const session = await getSession()
        if (!session?.user?.email) return null

        const users = await getCollection<UserDocument>('users')
        const currentUser = await users.findOne({ email: session.user.email })
        if (!currentUser) return null

        // 逐欄挑選，不要把整份 document 展開後回傳。
        // 展開會一併帶出 password，而這個結果會成為 client component 的 prop，
        // 等於把密碼雜湊序列化進 RSC payload 送到瀏覽器。
        return {
            id: currentUser._id.toString(),
            name: currentUser.name,
            email: currentUser.email,
            image: currentUser.image,
            nickname: currentUser.nickname,
            bio: currentUser.bio,
        }
    } catch (error) {
        console.error('[getUser] failed:', error)
        return null
    }
})
