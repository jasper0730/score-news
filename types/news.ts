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

/**
 * 一篇文章的評分現況。
 *
 * 兩個值要一起更新：averageRating 決定卡片與詳情頁顯示幾顆星，
 * userRating 決定評分表單裡有幾顆是亮的。只更新前者的話，
 * 刪掉自己的評論後表單仍會亮著已經不存在的分數。
 */
export interface RatingSummaryType {
    averageRating: number
    /** 目前使用者自己給的分數；沒評過或已刪除為 0 */
    userRating: number
}

export interface CommentApiResponse {
    success: boolean
    comments: CommentType[]
}

export type SortType = 'date_desc' | 'trending' | 'views' | 'favorites' | 'likes'

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
