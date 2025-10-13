import { NextResponse } from 'next/server'
import { getUser } from '@/actions/getUser'
import clientPromise from '@/libs/mongodb'

export async function POST(request: Request) {
    try {
        const currentUser = await getUser()
        if (!currentUser) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
        }

        const { id: userId } = currentUser
        const { id: postId } = await request.json()

        if (!postId) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db()
        const favoritesCollection = db.collection('favorites')

        const userFavorites = await favoritesCollection.findOne({ userId })

        if (userFavorites && userFavorites.postIds.includes(postId)) {
            await favoritesCollection.updateOne({ userId }, { $pull: { postIds: postId } })
            return NextResponse.json({ success: true, message: 'Favorite removed' })
        } else {
            await favoritesCollection.updateOne(
                { userId },
                { $addToSet: { postIds: postId } },
                { upsert: true }
            )
            return NextResponse.json({ success: true, message: 'Favorite added' })
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error in POST handler:', error.message)
            return new NextResponse(error.message, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
