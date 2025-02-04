import { NextAuthOptions } from "next-auth";
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import CredentialsProvider from 'next-auth/providers/credentials'
import clientPromise from "@/libs/mongodb";
import bcrypt from "bcrypt";
import { MongoDBAdapter } from "@auth/mongodb-adapter"

export const options: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  pages: {
    signIn: '/login'
  },
  providers: [
    GoogleProvider({
      clientId: process.env.OAUTH_GOOGLE_ID as string,
      clientSecret: process.env.OAUTH_GOOGLE_SECRET as string
    }),
    FacebookProvider({
      clientId: process.env.OAUTH_FACEBOOK_ID as string,
      clientSecret: process.env.OAUTH_FACEBOOK_SECRET as string
    }),
    GitHubProvider({
      clientId: process.env.OAUTH_GITHUB_ID as string,
      clientSecret: process.env.OAUTH_GITHUB_SECRET as string
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "Enter your email" },
        password: { label: "Password", type: "password", placeholder: "Enter your password" },
      },
      async authorize(credentials) {

        if (!credentials?.email || !credentials.password) {
          return null
        }

        // 連接到 database
        const client = await clientPromise;
        const db = client.db();
        const usersCollection = db.collection("users");

        // 查詢用戶
        const user = await usersCollection.findOne({ email: credentials.email });
        if (!user || !user.password) {
          throw new Error("帳號或密碼錯誤");
        }
        // 使用 bcrypt 比較密碼
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("帳號或密碼錯誤");
        }
        // 登入成功，返回用戶資料
        return {
          id: user._id.toString(),
          ...user,
        };
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      const client = await clientPromise;
      const db = client.db();
      const usersCollection = db.collection("users");
      const accountsCollection = db.collection("accounts");

      const existingUser = await usersCollection.findOne({ email: user.email });

      if (existingUser) {
        // 檢查該 Email 是否已經有該 OAuth 提供者
        const existingAccount = await accountsCollection.findOne({
          userId: existingUser._id,
          provider: account?.provider,
        });

        // if (!existingAccount) {
        //   await accountsCollection.insertOne({
        //     provider: account?.provider,
        //     type: account?.type,
        //     providerAccountId: account?.providerAccountId,
        //     userId: existingUser._id,
        //     access_token: account?.access_token,
        //     expires_at: account?.expires_at,
        //     refresh_token: account?.refresh_token,
        //   });
        // }
      }

      return true;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}