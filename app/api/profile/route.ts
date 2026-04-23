export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/libs/auth'
import { getCollection, UserDocument } from '@/libs/db'

export async function GET() {
    try {
        const auth = await requireAuth()
        if (!auth.authenticated) {
            return NextResponse.json(
                { success: false, message: auth.error },
                { status: 401 }
            )
        }

        const currentUser = auth.user
        const usersCollection = await getCollection<UserDocument>('users')

        const user = await usersCollection.findOne({
            _id: new ObjectId(currentUser.id) as unknown as UserDocument['_id'],
        })

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            profile: {
                nickname: user.nickname ?? '',
                bio: user.bio ?? '',
                avatar: user.image ?? '',
                name: user.name ?? '',
                email: user.email ?? '',
            },
        })
    } catch (error) {
        console.error('Profile GET error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const auth = await requireAuth()
        if (!auth.authenticated) {
            return NextResponse.json(
                { success: false, message: auth.error },
                { status: 401 }
            )
        }

        const currentUser = auth.user
        const { nickname, bio } = await request.json()

        if (nickname !== undefined && nickname.length > 20) {
            return NextResponse.json(
                { success: false, message: '暱稱不能超過 20 個字' },
                { status: 400 }
            )
        }

        if (bio !== undefined && bio.length > 200) {
            return NextResponse.json(
                { success: false, message: '自我介紹不能超過 200 個字' },
                { status: 400 }
            )
        }

        const usersCollection = await getCollection<UserDocument>('users')

        const updateFields: Record<string, string> = {}
        if (nickname !== undefined) updateFields.nickname = nickname.trim()
        if (bio !== undefined) updateFields.bio = bio.trim()

        await usersCollection.updateOne(
            { _id: new ObjectId(currentUser.id) as unknown as UserDocument['_id'] },
            { $set: updateFields }
        )

        return NextResponse.json({
            success: true,
            message: '個人資料已更新',
            profile: updateFields,
        })
    } catch (error) {
        console.error('Profile PUT error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        )
    }
}
