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

      const existingUser = await usersCollection.findOne({ email: user.email });

      if (existingUser && existingUser.provider !== account?.provider) {
        // 如果已有相同 Email 的帳號但不同 Provider，則更新它的 provider 資料
        await usersCollection.updateOne(
          { _id: new Object(existingUser._id) },
          { $set: { provider: account?.provider } }
        );
      }

      return true;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}