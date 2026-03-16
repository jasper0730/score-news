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

export type SortType = 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc' | 'views'

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

export type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string }
