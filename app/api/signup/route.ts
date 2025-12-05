import { z } from 'zod'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/libs/mongodb'

const validate = z.object({
    email: z
        .string({
            required_error: 'email請輸入',
        })
        .email('請輸入正確的 Email 格式'),
    password: z
        .string({
            required_error: '請輸入password',
        })
        .min(8, '最少要 8 個字')
        .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/, '密碼須包含英文和數字'),
})

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json()

        // 驗證輸入
        if (!email || !password || password.length < 8) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 })
        }
        const result = validate.safeParse({ email, password })
        if (!result.success) {
            throw new z.ZodError(result.error.issues)
        }

        // 連接database
        const client = await clientPromise
        const db = client.db()
        const usersCollection = db.collection('users')

        // 檢查用戶是否已存在
        const existingUser = await usersCollection.findOne({ email })

        if (existingUser) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 })
        }

        // 加密
        const hashedPassword = await bcrypt.hash(password, 12)

        // 存入用戶
        const user = await usersCollection.insertOne({
            email,
            password: hashedPassword,
        })

        return NextResponse.json(user)
    } catch (error) {
        // 檢查error型別是否為ZodError物件
        if (error instanceof z.ZodError) {
            const message = error.errors.map((e) => e.message).join(', ')
            return new NextResponse(message, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
