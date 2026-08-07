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
    /** 最後一次編輯時間。沒有這個欄位代表從未編輯過 */
    editedAt?: string
    /**
     * 軟刪除。留著文件而不是真的刪掉，是為了留下審核軌跡、
     * 也才能區分「本人刪除」與「管理員下架」兩種顯示方式。
     */
    deletedAt?: string
    /** 執行刪除的人 */
    deletedBy?: string
    /** 是否為管理員代為刪除。本人自刪為 false，畫面上直接不顯示 */
    deletedByAdmin?: boolean
}

/**
 * 評論的歷史版本。
 *
 * 每次編輯把「被取代掉的舊內容」寫進來，主表只保留最新版本——
 * 讀取評論是熱路徑，不該為了偶爾才看的歷史去掃一堆版本。
 */
export interface CommentEditHistoryDocument {
    _id?: ObjectId
    commentId: ObjectId
    userId: string
    postId: string
    /** 被取代掉的內容 */
    content: string
    rating?: number
    /** 這個版本被取代的時間 */
    replacedAt: string
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
