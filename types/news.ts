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

export type SortType = 'rating' | 'date'

export type AuthFormType = 'login' | 'signup'

export type ToastState = 'success' | 'error' | 'warning'
