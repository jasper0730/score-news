import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { NewsDataType } from '@/types/news'

vi.mock('@/components/organisms/CommentSection', () => ({ default: () => null }))

const NewsModal = (await import('@/components/organisms/NewsModal')).default

const article: NewsDataType = {
    article_id: 'news-1',
    title: '颱風來襲',
    description: '摘要',
    content: '內文',
    image_url: '',
    pubDate: '2026-01-01',
    source_icon: '',
    source_name: '中央社',
    source_url: '',
    rate: 0,
    favorite: false,
    favorites: 0,
    likes: 0,
    liked: false,
    views: 0,
}

const renderModal = (props = {}) =>
    render(<NewsModal data={article} open onClose={vi.fn()} onRatingUpdate={vi.fn()} {...props} />)

describe('NewsModal', () => {
    it('關閉時不渲染新聞內容', () => {
        renderModal({ open: false })

        expect(screen.queryByRole('heading', { name: '颱風來襲' })).not.toBeInTheDocument()
    })

    it('開啟時渲染新聞詳情', () => {
        renderModal()

        expect(screen.getByRole('heading', { name: '颱風來襲' })).toBeInTheDocument()
    })

    it('詳情裡的關閉鈕會關閉彈窗', async () => {
        const onClose = vi.fn()
        renderModal({ onClose })

        await userEvent.click(screen.getByRole('button', { name: '關閉新聞詳情' }))

        expect(onClose).toHaveBeenCalledOnce()
    })
})
