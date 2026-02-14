import { NextResponse } from 'next/server'
import { getUser } from '@/actions/getUser'
import clientPromise from '@/libs/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
    try {
        const currentUser = await getUser()
        if (!currentUser) {
            return NextResponse.json(
                { success: false, message: 'User not authenticated' },
                { status: 401 }
            )
        }

        const client = await clientPromise
        const db = client.db()
        const usersCollection = db.collection('users')

        const user = await usersCollection.findOne({
            _id: new ObjectId(currentUser.id),
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
        const currentUser = await getUser()
        if (!currentUser) {
            return NextResponse.json(
                { success: false, message: 'User not authenticated' },
                { status: 401 }
            )
        }

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

        const client = await clientPromise
        const db = client.db()
        const usersCollection = db.collection('users')

        const updateFields: Record<string, string> = {}
        if (nickname !== undefined) updateFields.nickname = nickname.trim()
        if (bio !== undefined) updateFields.bio = bio.trim()

        await usersCollection.updateOne(
            { _id: new ObjectId(currentUser.id) },
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
