export interface NewsDataType {
    article_id: string
    title: string
    description: string
    content: string
    link?: string
    image_url: string
    pubDate: string
    source_icon: string
    source_name: string
    source_url: string
    rate: number
    userRate?: number
    favorite: boolean
    /** 這篇文章的收藏總數 */
    favorites: number
    /** 這篇文章的按讚總數 */
    likes: number
    /** 目前使用者有沒有按過讚；未登入時一律 false */
    liked: boolean
    views?: number
}

export interface NewsApiResponse {
    data: NewsDataType[]
    success: boolean
    hasMore?: boolean
    total?: number
}

export interface CommentType {
    _id: string
    userId: string
    userName: string
    userImage: string
    postId: string
    postTitle: string
    content: string
    rating?: number
    createdAt: string
}

export interface CommentApiResponse {
    success: boolean
    comments: CommentType[]
}

export type SortType = 'date_desc' | 'views' | 'favorites' | 'rating_desc' | 'likes'

export type DashboardTab = 'favorites' | 'comments' | 'profile'

export type AuthFormType = 'login' | 'signup'

export type ToastState = 'success' | 'error' | 'warning'

export interface ProfileType {
    nickname: string
    bio: string
    avatar: string
    name?: string
    email?: string
}
