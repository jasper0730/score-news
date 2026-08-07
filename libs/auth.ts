import { getUser } from '@/actions/getUser'
import { isAdminEmail } from '@/libs/admin'
import type { UserType } from '@/types/user'

type AuthResult = { authenticated: true; user: UserType } | { authenticated: false; error: string }

export async function requireAuth(): Promise<AuthResult> {
    const user = await getUser()
    if (!user) {
        return { authenticated: false, error: 'User not authenticated' }
    }
    return { authenticated: true, user }
}

/**
 * 取得目前使用者，並一併回報他是不是管理員。
 *
 * 給「一般使用者與管理員都能做，但範圍不同」的操作用——例如刪留言：
 * 一般使用者只能刪自己的，管理員可以刪任何一則。
 *
 * 需要「只有管理員能做」的操作時，判斷 isAdmin 為 false 就直接拒絕即可。
 */
export async function requireAuthWithRole(): Promise<
    | { authenticated: true; user: UserType; isAdmin: boolean }
    | { authenticated: false; error: string }
> {
    const auth = await requireAuth()
    if (!auth.authenticated) return auth
    return { ...auth, isAdmin: isAdminEmail(auth.user.email) }
}
