import { NextResponse } from 'next/server'
import { getUser } from '@/actions/getUser'
import clientPromise from '@/libs/mongodb'

export async function POST(request: Request) {
    const currentUser = await getUser()
    if (!currentUser) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }
    try {
        const { id: userId } = currentUser
        const { id: postId, rate } = await request.json()

        if (!postId) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db()
        const ratingsCollection = db.collection('ratings')
        const existingRating = await ratingsCollection.findOne({ userId, postId })
        if (existingRating) {
            await ratingsCollection.updateOne({ userId, postId }, { $set: { rate } })
        } else {
            await ratingsCollection.insertOne({ userId, postId, rate })
        }

        const ratings = await ratingsCollection
            .aggregate([
                { $match: { postId } },
                {
                    $group: {
                        _id: postId,
                        avgRating: { $avg: '$rate' },
                    },
                },
            ])
            .toArray()

        const avgRating = ratings.length > 0 ? ratings[0].avgRating : rate
        return NextResponse.json({
            state: 'success',
            rate: avgRating,
        })
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error in POST handler:', error.message)
            return new NextResponse(error.message, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
