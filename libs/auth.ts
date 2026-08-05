import { getUser } from '@/actions/getUser'
import type { UserType } from '@/types/user'

type AuthResult = { authenticated: true; user: UserType } | { authenticated: false; error: string }

export async function requireAuth(): Promise<AuthResult> {
    const user = await getUser()
    if (!user) {
        return { authenticated: false, error: 'User not authenticated' }
    }
    return { authenticated: true, user }
}
