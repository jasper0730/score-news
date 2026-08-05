import { ObjectId } from 'mongodb'
import type { NewsDocument, CommentDocument, UserDocument } from '@/libs/db'
import type { UserType } from '@/types/user'

export const USER_ID = '507f1f77bcf86cd799439011'
export const OTHER_USER_ID = '507f1f77bcf86cd799439012'

export function makeUser(overrides: Partial<UserType> = {}): UserType {
    return {
        id: USER_ID,
        name: '小明',
        email: 'ming@example.com',
        image: 'https://example.com/avatar.png',
        nickname: '阿明',
        bio: '哈囉',
        ...overrides,
    }
}

export function makeUserDoc(overrides: Partial<UserDocument> = {}): UserDocument {
    return {
        _id: new ObjectId(USER_ID),
        email: 'ming@example.com',
        password: '$2a$12$hashed',
        name: '小明',
        image: 'https://example.com/avatar.png',
        nickname: '阿明',
        bio: '哈囉',
        ...overrides,
    }
}

/** avgRating 只有依評分排序的 aggregate 結果才會帶，所以是選填 */
export function makeNewsDoc(
    overrides: Partial<NewsDocument> & { avgRating?: number } = {}
): NewsDocument & { _id: ObjectId; avgRating?: number } {
    return {
        _id: new ObjectId(),
        article_id: 'news-1',
        title: '標題',
        description: '描述',
        content: '內文',
        link: 'https://example.com/news-1',
        image_url: 'https://example.com/news-1.jpg',
        pubDate: '2026-01-01 10:00:00',
        source_icon: 'https://example.com/icon.png',
        source_name: '來源',
        source_url: 'https://example.com',
        views: 5,
        ...overrides,
    }
}

export function makeCommentDoc(
    overrides: Partial<CommentDocument> = {}
): CommentDocument & { _id: ObjectId } {
    return {
        _id: new ObjectId(),
        userId: USER_ID,
        userName: '阿明',
        userImage: 'https://example.com/avatar.png',
        postId: 'news-1',
        postTitle: '標題',
        content: '很棒的報導',
        rating: 4,
        createdAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    }
}
