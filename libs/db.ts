import { Collection, Db, ObjectId } from 'mongodb'
import getMongoClient from '@/libs/mongodb'

export interface NewsDocument {
    article_id: string
    title: string
    description: string
    content: string
    /** 原文連結。content 只有摘要時，前端會用它導向原始新聞 */
    link?: string
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

/**
 * 按讚。
 *
 * 刻意做成「一位使用者對一篇文章一份文件」而非比照 favorites 的
 * 「一位使用者一份文件、postIds 陣列」——按讚要顯示總數，
 * 陣列結構算某篇有幾個讚得掃過所有使用者的文件。
 */
export interface LikeDocument {
    userId: string
    postId: string
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
    const client = await getMongoClient()
    return client.db()
}

export async function getCollection<T extends object = object>(
    name: string
): Promise<Collection<T>> {
    const db = await getDb()
    return db.collection<T>(name)
}
