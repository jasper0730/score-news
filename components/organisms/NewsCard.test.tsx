import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { NewsDataType } from '@/types/news'

const useSession = vi.hoisted(() => vi.fn())
vi.mock('next-auth/react', () => ({ useSession }))

const NewsCard = (await import('@/components/organisms/NewsCard')).default

function makeArticle(overrides: Partial<NewsDataType> = {}): NewsDataType {
    return {
        article_id: 'news-1',
        title: '颱風來襲',
        description: '中央氣象署發布陸上颱風警報',
        content: '內文',
        image_url: '',
        pubDate: '2026-01-01 10:00:00',
        source_icon: 'https://example.com/icon.png',
        source_name: '中央社',
        source_url: 'https://example.com',
        rate: 4,
        favorite: false,
        views: 10,
        ...overrides,
    }
}

const renderCard = (props: Partial<Parameters<typeof NewsCard>[0]> = {}) =>
    render(
        <NewsCard article={makeArticle()} favorite={false} onFavoriteClick={vi.fn()} {...props} />
    )

beforeEach(() => {
    useSession.mockReturnValue({ status: 'authenticated', data: { user: { id: 'u1' } } })
})

describe('NewsCard 內容', () => {
    it('顯示標題、描述與發佈日期', () => {
        renderCard()

        expect(screen.getByRole('heading', { name: '颱風來襲' })).toBeInTheDocument()
        expect(screen.getByText('中央氣象署發布陸上颱風警報')).toBeInTheDocument()
        expect(screen.getByText('日期：2026-01-01 10:00:00')).toBeInTheDocument()
    })

    it('來源連結在新分頁開啟，並加上 noopener 避免被反向操控', () => {
        renderCard()

        const link = screen.getByRole('link', { name: '中央社' })
        expect(link).toHaveAttribute('href', 'https://example.com')
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('顯示點閱數', () => {
        renderCard({ article: makeArticle({ views: 42 }) })

        expect(screen.getByRole('img', { name: '點閱 42 次' })).toHaveTextContent('42')
    })

    it('點閱數加上千分位，數字大時才讀得出量級', () => {
        renderCard({ article: makeArticle({ views: 12345 }) })

        expect(screen.getByRole('img', { name: /點閱/ })).toHaveTextContent('12,345')
    })

    it('沒有人看過時顯示 0，不是空白也不是 undefined', () => {
        renderCard({ article: makeArticle({ views: 0 }) })

        expect(screen.getByRole('img', { name: '點閱 0 次' })).toBeInTheDocument()
    })

    it('資料缺少 views 欄位時補 0', () => {
        // 剛從 RSS 匯入、還沒被開啟過的新聞會是這個狀態
        renderCard({ article: makeArticle({ views: undefined }) })

        expect(screen.getByRole('img', { name: '點閱 0 次' })).toBeInTheDocument()
    })

    it('點閱數更新時畫面跟著變——開啟新聞後列表會收到新數字', () => {
        const { rerender } = render(
            <NewsCard
                article={makeArticle({ views: 10 })}
                favorite={false}
                onFavoriteClick={vi.fn()}
            />
        )
        expect(screen.getByRole('img', { name: '點閱 10 次' })).toBeInTheDocument()

        rerender(
            <NewsCard
                article={makeArticle({ views: 11 })}
                favorite={false}
                onFavoriteClick={vi.fn()}
            />
        )

        expect(screen.getByRole('img', { name: '點閱 11 次' })).toBeInTheDocument()
    })

    it('顯示評分星等', () => {
        renderCard()

        expect(screen.getByRole('img', { name: '評分 4 顆星' })).toBeInTheDocument()
    })

    it('沒有評分時不顯示星等', () => {
        renderCard({ article: makeArticle({ rate: 0 }) })

        expect(screen.queryByRole('img', { name: /評分/ })).not.toBeInTheDocument()
    })

    it('沒有來源圖示時不渲染圖片', () => {
        renderCard({ article: makeArticle({ source_icon: '' }) })

        expect(screen.queryByRole('img', { name: '' })).not.toBeInTheDocument()
    })
})

describe('NewsCard 收藏', () => {
    it('未登入時不顯示收藏鈕', () => {
        useSession.mockReturnValue({ status: 'unauthenticated', data: null })
        renderCard()

        expect(screen.queryByRole('button', { name: /收藏/ })).not.toBeInTheDocument()
    })

    it('登入後顯示收藏鈕', () => {
        renderCard()

        expect(screen.getByRole('button', { name: '加入收藏' })).toBeInTheDocument()
    })

    it('已收藏時按鈕改為取消收藏', () => {
        renderCard({ favorite: true })

        expect(screen.getByRole('button', { name: '取消收藏' })).toBeInTheDocument()
    })

    it('點擊時帶出文章 id', async () => {
        const onFavoriteClick = vi.fn()
        renderCard({ onFavoriteClick })

        await userEvent.click(screen.getByRole('button', { name: '加入收藏' }))

        expect(onFavoriteClick).toHaveBeenCalledWith('news-1')
    })
})

describe('NewsCard 開啟詳情', () => {
    it('點 More 時通知外層', async () => {
        const onMoreClick = vi.fn()
        renderCard({ onMoreClick })

        await userEvent.click(screen.getByRole('button', { name: 'More' }))

        expect(onMoreClick).toHaveBeenCalledOnce()
    })

    it('未登入也能開啟詳情', async () => {
        useSession.mockReturnValue({ status: 'unauthenticated', data: null })
        const onMoreClick = vi.fn()
        renderCard({ onMoreClick })

        await userEvent.click(screen.getByRole('button', { name: 'More' }))

        expect(onMoreClick).toHaveBeenCalledOnce()
    })
})
