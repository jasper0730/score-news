import { Collection, Db, ObjectId } from 'mongodb'
import clientPromise from '@/libs/mongodb'

export interface NewsDocument {
    article_id: string
    title: string
    description: string
    content: string
    image_url: string
    pubDate: string
    source_icon: string
    source_name: string
    source_url: string
    views?: number
}

export interface FavoriteDocument {
    userId: string
    postIds: string[]
}

export interface RatingDocument {
    userId: string
    postId: string
    rate: number
}

export interface CommentDocument {
    _id?: ObjectId
    userId: string
    userName: string
    userImage: string
    postId: string
    postTitle: string
    content: string
    rating?: number
    createdAt: string
}

export interface UserDocument {
    _id?: ObjectId
    email: string
    password?: string
    name?: string
    image?: string
    nickname?: string
    bio?: string
}

export async function getDb(): Promise<Db> {
    const client = await clientPromise
    return client.db()
}

export async function getCollection<T extends object = object>(name: string): Promise<Collection<T>> {
    const db = await getDb()
    return db.collection<T>(name)
}
