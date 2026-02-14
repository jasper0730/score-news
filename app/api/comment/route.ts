import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getUser } from '@/actions/getUser'
import clientPromise from '@/libs/mongodb'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const postId = searchParams.get('postId')
        const userId = searchParams.get('userId')

        const client = await clientPromise
        const db = client.db()
        const commentsCollection = db.collection('comments')

        if (postId) {
            const comments = await commentsCollection
                .find({ postId })
                .sort({ createdAt: -1 })
                .toArray()

            const serialized = comments.map((c) => ({
                ...c,
                _id: c._id.toString(),
            }))

            return NextResponse.json({ success: true, comments: serialized })
        }

        if (userId) {
            const comments = await commentsCollection
                .find({ userId })
                .sort({ createdAt: -1 })
                .toArray()

            const serialized = comments.map((c) => ({
                ...c,
                _id: c._id.toString(),
            }))

            return NextResponse.json({ success: true, comments: serialized })
        }

        return NextResponse.json(
            { success: false, message: 'postId or userId is required' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Comment GET error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const currentUser = await getUser()
        if (!currentUser) {
            return NextResponse.json(
                { success: false, message: 'User not authenticated' },
                { status: 401 }
            )
        }

        const { postId, postTitle, content } = await request.json()

        if (!postId || !content?.trim()) {
            return NextResponse.json(
                { success: false, message: 'postId and content are required' },
                { status: 400 }
            )
        }

        const client = await clientPromise
        const db = client.db()
        const commentsCollection = db.collection('comments')
        const usersCollection = db.collection('users')

        const userDoc = await usersCollection.findOne({
            _id: new ObjectId(currentUser.id),
        })
        const displayName =
            userDoc?.nickname || currentUser.name || currentUser.email || '匿名用戶'

        const newComment = {
            userId: currentUser.id,
            userName: displayName,
            userImage: currentUser.image ?? '',
            postId,
            postTitle: postTitle ?? '',
            content: content.trim(),
            createdAt: new Date().toISOString(),
        }

        const result = await commentsCollection.insertOne(newComment)

        return NextResponse.json({
            success: true,
            comment: {
                ...newComment,
                _id: result.insertedId.toString(),
            },
        })
    } catch (error) {
        console.error('Comment POST error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request) {
    try {
        const currentUser = await getUser()
        if (!currentUser) {
            return NextResponse.json(
                { success: false, message: 'User not authenticated' },
                { status: 401 }
            )
        }

        const { commentId } = await request.json()

        if (!commentId) {
            return NextResponse.json(
                { success: false, message: 'commentId is required' },
                { status: 400 }
            )
        }

        const client = await clientPromise
        const db = client.db()
        const commentsCollection = db.collection('comments')

        const result = await commentsCollection.deleteOne({
            _id: new ObjectId(commentId),
            userId: currentUser.id,
        })

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, message: 'Comment not found or unauthorized' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, message: 'Comment deleted' })
    } catch (error) {
        console.error('Comment DELETE error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        )
    }
}
