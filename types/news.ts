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
    /** 最後一次編輯時間，用來顯示「已編輯」標記 */
    editedAt?: string
    /**
     * 是否為管理員下架的墓碑。
     * 只有這種狀態會被送到前端——本人自刪的評論在伺服器端就濾掉了。
     * 為 true 時 content 與 rating 已被清空，不會外洩原始內容。
     */
    isRemovedByAdmin?: boolean
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
