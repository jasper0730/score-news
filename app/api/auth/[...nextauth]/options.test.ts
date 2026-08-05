import { ObjectId } from 'mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Account, Session, User } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import { collection } from '@/test/helpers/db'
import { makeUserDoc, USER_ID } from '@/test/helpers/fixtures'

vi.mock('@/libs/mongodb', async () => {
    const { collection } = await import('@/test/helpers/db')
    const client = { db: () => ({ collection: (name: string) => collection(name) }) }
    return { default: () => Promise.resolve(client), getMongoClient: () => Promise.resolve(client) }
})

const compare = vi.hoisted(() => vi.fn())
vi.mock('bcryptjs', () => ({ default: { compare, hash: vi.fn() }, compare }))

// adapter 本身是 next-auth 的責任，這裡只要它不要真的去連資料庫
vi.mock('@auth/mongodb-adapter', () => ({ MongoDBAdapter: () => ({}) }))

const { options } = await import('@/app/api/auth/[...nextauth]/options')

/** 取出 CredentialsProvider 的 authorize，用來直接測登入邏輯 */
function getAuthorize() {
    const provider = options.providers.find((p) => p.id === 'credentials') as unknown as {
        options: {
            authorize: (credentials: Record<string, string> | undefined) => Promise<unknown | null>
        }
    }
    return provider.options.authorize
}

beforeEach(() => {
    compare.mockResolvedValue(true)
})

describe('NextAuth 設定', () => {
    it('使用 JWT session 策略', () => {
        expect(options.session?.strategy).toBe('jwt')
    })

    it('自訂登入頁指向 /login', () => {
        expect(options.pages?.signIn).toBe('/login')
    })

    it('提供 Google / Facebook / GitHub 與帳密四種登入方式', () => {
        expect(options.providers.map((p) => p.id).sort()).toEqual(
            ['credentials', 'facebook', 'github', 'google'].sort()
        )
    })
})

describe('credentials 登入', () => {
    it('沒填 email 或密碼時直接拒絕，不查資料庫', async () => {
        const authorize = getAuthorize()

        expect(await authorize({ email: '', password: 'abcd1234' })).toBeNull()
        expect(await authorize({ email: 'ming@example.com', password: '' })).toBeNull()
        expect(await authorize(undefined)).toBeNull()
        expect(collection('users').findOne).not.toHaveBeenCalled()
    })

    it('帳號不存在時的錯誤訊息與密碼錯誤時相同，避免被列舉帳號', async () => {
        collection('users').findOne.mockResolvedValue(null)

        await expect(
            getAuthorize()({ email: 'ghost@example.com', password: 'abcd1234' })
        ).rejects.toThrow('帳號或密碼錯誤')
    })

    it('OAuth 註冊的帳號沒有密碼，不能用帳密登入', async () => {
        collection('users').findOne.mockResolvedValue(makeUserDoc({ password: undefined }))

        await expect(
            getAuthorize()({ email: 'ming@example.com', password: 'abcd1234' })
        ).rejects.toThrow('帳號或密碼錯誤')
    })

    it('密碼比對走 bcrypt，不做明碼比較', async () => {
        collection('users').findOne.mockResolvedValue(makeUserDoc({ password: '$2a$12$hashed' }))

        await getAuthorize()({ email: 'ming@example.com', password: 'abcd1234' })

        expect(compare).toHaveBeenCalledWith('abcd1234', '$2a$12$hashed')
    })

    it('密碼錯誤時拒絕登入', async () => {
        collection('users').findOne.mockResolvedValue(makeUserDoc())
        compare.mockResolvedValue(false)

        await expect(
            getAuthorize()({ email: 'ming@example.com', password: 'wrong' })
        ).rejects.toThrow('帳號或密碼錯誤')
    })

    it('登入成功時帶回字串型別的 id', async () => {
        collection('users').findOne.mockResolvedValue(makeUserDoc())

        const user = (await getAuthorize()({
            email: 'ming@example.com',
            password: 'abcd1234',
        })) as { id: string }

        expect(user.id).toBe(USER_ID)
    })
})

describe('session callback', () => {
    it('把 token.sub 補進 session.user.id', async () => {
        // JWT 策略下 next-auth 組出來的 session.user 只有 name / email / image，
        // 少了這段，client 端的 session.user.id 會永遠是 undefined
        const session = { user: { email: 'ming@example.com' }, expires: '' } as Session
        const token = { sub: USER_ID } as JWT

        const result = await options.callbacks!.session!({
            session,
            token,
        } as Parameters<NonNullable<NonNullable<typeof options.callbacks>['session']>>[0])

        expect((result.user as { id?: string }).id).toBe(USER_ID)
    })

    it('沒有 token.sub 時原樣回傳，不會爆掉', async () => {
        const session = { user: { email: 'ming@example.com' }, expires: '' } as Session

        const result = await options.callbacks!.session!({
            session,
            token: {} as JWT,
        } as Parameters<NonNullable<NonNullable<typeof options.callbacks>['session']>>[0])

        expect((result.user as { id?: string }).id).toBeUndefined()
    })
})

describe('signIn callback', () => {
    const user = { email: 'ming@example.com' } as User
    const account = {
        provider: 'google',
        type: 'oauth',
        providerAccountId: 'google-123',
        access_token: 'token',
    } as Account

    const signIn = (u: User, a: Account | null) =>
        options.callbacks!.signIn!({ user: u, account: a } as Parameters<
            NonNullable<NonNullable<typeof options.callbacks>['signIn']>
        >[0])

    it('既有帳號第一次用某個 OAuth 提供者登入時補上 account 紀錄', async () => {
        const existing = { _id: new ObjectId(USER_ID), email: 'ming@example.com' }
        collection('users').findOne.mockResolvedValue(existing)
        collection('accounts').findOne.mockResolvedValue(null)

        await expect(signIn(user, account)).resolves.toBe(true)

        expect(collection('accounts').insertOne).toHaveBeenCalledWith(
            expect.objectContaining({
                provider: 'google',
                providerAccountId: 'google-123',
                userId: existing._id,
            })
        )
    })

    it('同一個提供者重複登入不會重複寫入 account', async () => {
        collection('users').findOne.mockResolvedValue({
            _id: new ObjectId(USER_ID),
            email: 'ming@example.com',
        })
        collection('accounts').findOne.mockResolvedValue({ provider: 'google' })

        await signIn(user, account)

        expect(collection('accounts').insertOne).not.toHaveBeenCalled()
    })

    it('全新使用者交給 adapter 建立，這裡不自行寫入', async () => {
        collection('users').findOne.mockResolvedValue(null)

        await expect(signIn(user, account)).resolves.toBe(true)
        expect(collection('accounts').insertOne).not.toHaveBeenCalled()
    })
})
