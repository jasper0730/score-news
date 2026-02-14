export interface NewsDataType {
    article_id: string
    title: string
    description: string
    content: string
    image_url: string
    pubDate: string
    source_icon: string
    source_name: string
    source_url: string
    rate: number
    favorite: boolean
}

export interface NewsApiResponse {
    data: NewsDataType[]
    success: boolean
}

export interface CommentType {
    _id: string
    userId: string
    userName: string
    userImage: string
    postId: string
    postTitle: string
    content: string
    createdAt: string
}

export interface CommentApiResponse {
    success: boolean
    comments: CommentType[]
}

export type SortType = 'rating' | 'date'

export type DashboardTab = 'favorites' | 'comments' | 'profile'

export type AuthFormType = 'login' | 'signup'

export type ToastState = 'success' | 'error' | 'warning'

export interface ProfileType {
    nickname: string
    bio: string
    avatar: string
}
