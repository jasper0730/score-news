import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { NewsDataType } from '@/types/news'

const useSession = vi.hoisted(() => vi.fn(() => ({ status: 'authenticated', data: null })))
vi.mock('next-auth/react', () => ({ useSession }))

const NewsInfiniteGrid = (await import('@/components/organisms/NewsInfiniteGrid')).default

function makeArticle(id: string): NewsDataType {
    return {
        article_id: id,
        title: `標題 ${id}`,
        description: '描述',
        content: '內文',
        image_url: '',
        pubDate: '2026-01-01',
        source_icon: '',
        source_name: '來源',
        source_url: '',
        rate: 0,
        favorite: false,
        likes: 0,
        liked: false,
        views: 0,
    }
}

const renderGrid = (props: Partial<Parameters<typeof NewsInfiniteGrid>[0]> = {}) =>
    render(
        <NewsInfiniteGrid
            items={[makeArticle('a')]}
            total={1}
            favorites={[]}
            hasMore={false}
            isLoading={false}
            sentinelRef={createRef<HTMLDivElement>()}
            onFavoriteClick={vi.fn()}
            onMoreClick={vi.fn()}
            {...props}
        />
    )

describe('NewsInfiniteGrid', () => {
    it('渲染每一篇文章', () => {
        renderGrid({ items: [makeArticle('a'), makeArticle('b')], total: 2 })

        expect(screen.getByRole('heading', { name: '標題 a' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: '標題 b' })).toBeInTheDocument()
    })

    it('把收藏狀態傳給對應的卡片', () => {
        renderGrid({ items: [makeArticle('a'), makeArticle('b')], total: 2, favorites: ['b'] })

        expect(screen.getAllByRole('button', { name: '取消收藏' })).toHaveLength(1)
    })

    it('搜尋不到資料時顯示空狀態', () => {
        renderGrid({ items: [], total: 0 })

        expect(screen.getByText('無相符的資料，請重新搜尋')).toBeInTheDocument()
    })

    it('還在載入時先不顯示空狀態，避免畫面閃一下「查無資料」', () => {
        renderGrid({ items: [], total: 0, isLoading: true })

        expect(screen.queryByText('無相符的資料，請重新搜尋')).not.toBeInTheDocument()
        expect(screen.getByRole('status')).toHaveTextContent('載入中...')
    })

    it('全部載入完畢時顯示結束提示', () => {
        renderGrid({ hasMore: false, isLoading: false })

        expect(screen.getByText('已載入全部文章')).toBeInTheDocument()
    })

    it('還有下一頁時不顯示結束提示', () => {
        renderGrid({ hasMore: true })

        expect(screen.queryByText('已載入全部文章')).not.toBeInTheDocument()
    })

    it('點 More 時把整篇文章交給外層', async () => {
        const onMoreClick = vi.fn()
        renderGrid({ onMoreClick })

        await userEvent.click(screen.getByRole('button', { name: 'More' }))

        expect(onMoreClick).toHaveBeenCalledWith(expect.objectContaining({ article_id: 'a' }))
    })

    it('sentinel 掛在傳入的 ref 上，無限捲動才觀察得到', () => {
        const sentinelRef = createRef<HTMLDivElement>()
        renderGrid({ sentinelRef })

        expect(sentinelRef.current).toBeInstanceOf(HTMLDivElement)
    })
})
