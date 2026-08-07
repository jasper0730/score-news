import { NextAuthOptions } from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import CredentialsProvider from 'next-auth/providers/credentials'
import getMongoClient from '@/libs/mongodb'
import bcrypt from 'bcryptjs'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { isAdminEmail } from '@/libs/admin'

export const options: NextAuthOptions = {
    adapter: MongoDBAdapter(getMongoClient()),
    pages: {
        signIn: '/login',
    },
    providers: [
        GoogleProvider({
            clientId: process.env.OAUTH_GOOGLE_ID as string,
            clientSecret: process.env.OAUTH_GOOGLE_SECRET as string,
            // 強制顯示帳號選擇器。不加的話，瀏覽器已登入單一 Google 帳號時
            // 會直接用那個帳號完成流程，使用者沒有機會選——而選錯帳號的症狀是
            // OAuthAccountNotLinked，訊息完全看不出「你只是選到別的帳號」。
            authorization: { params: { prompt: 'select_account' } },
        }),
        FacebookProvider({
            clientId: process.env.OAUTH_FACEBOOK_ID as string,
            clientSecret: process.env.OAUTH_FACEBOOK_SECRET as string,
        }),
        GitHubProvider({
            clientId: process.env.OAUTH_GITHUB_ID as string,
            clientSecret: process.env.OAUTH_GITHUB_SECRET as string,
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email', placeholder: 'Enter your email' },
                password: {
                    label: 'Password',
                    type: 'password',
                    placeholder: 'Enter your password',
                },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    return null
                }

                // 連接到 database
                const client = await getMongoClient()
                const db = client.db()
                const usersCollection = db.collection('users')

                // 查詢用戶
                const user = await usersCollection.findOne({ email: credentials.email })
                if (!user || !user.password) {
                    throw new Error('帳號或密碼錯誤')
                }
                // 使用 bcrypt 比較密碼
                const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
                if (!isPasswordValid) {
                    throw new Error('帳號或密碼錯誤')
                }
                // 登入成功，返回用戶資料
                return {
                    id: user._id.toString(),
                    ...user,
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        /**
         * JWT 策略下 next-auth 組出來的 session.user 只有 name / email / image，
         * 使用者 id 只存在於 token.sub（登入時由 user.id 寫入）。
         * 少了這個 callback，client 端的 session.user.id 會永遠是 undefined。
         */
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub
            }
            // 讓前端知道要不要顯示管理員專用的操作。這只是介面用途——
            // 真正的權限檢查在 server action 裡，不能只靠這個值。
            if (session.user) {
                session.user.isAdmin = isAdminEmail(session.user.email)
            }
            return session
        },
        async signIn({ user, account }) {
            const client = await getMongoClient()
            const db = client.db()
            const usersCollection = db.collection('users')
            const accountsCollection = db.collection('accounts')

            const existingUser = await usersCollection.findOne({ email: user.email })

            if (existingUser) {
                // 檢查該 Email 是否已經有該 OAuth 提供者
                const existingAccount = await accountsCollection.findOne({
                    userId: existingUser._id,
                    provider: account?.provider,
                })

                if (!existingAccount) {
                    await accountsCollection.insertOne({
                        provider: account?.provider,
                        type: account?.type,
                        providerAccountId: account?.providerAccountId,
                        userId: existingUser._id,
                        access_token: account?.access_token,
                        expires_at: account?.expires_at,
                        refresh_token: account?.refresh_token,
                    })
                }
            }

            return true
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}
