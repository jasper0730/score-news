import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { NewsDataType } from '@/types/news'

// CommentSection 有自己的測試，這裡只確認有沒有掛上去、參數對不對
const CommentSection = vi.hoisted(() => vi.fn(() => null)) as unknown as ReturnType<typeof vi.fn>
vi.mock('@/components/organisms/CommentSection', () => ({ default: CommentSection }))

const NewsDetail = (await import('@/components/organisms/NewsDetail')).default

function makeArticle(overrides: Partial<NewsDataType> = {}): NewsDataType {
    return {
        article_id: 'news-1',
        title: '颱風來襲',
        description: '這是摘要',
        content: '這是完整內文',
        link: 'https://example.com/full',
        image_url: 'https://example.com/pic.jpg',
        pubDate: '2026-01-01',
        source_icon: '',
        source_name: '中央社',
        source_url: 'https://example.com',
        rate: 4,
        favorite: false,
        views: 10,
        ...overrides,
    }
}

const renderDetail = (data: NewsDataType | null = makeArticle(), props = {}) =>
    render(<NewsDetail data={data} onClose={vi.fn()} onRatingUpdate={vi.fn()} {...props} />)

beforeEach(() => {
    ;(CommentSection as ReturnType<typeof vi.fn>).mockClear()
})

describe('NewsDetail 內容', () => {
    it('顯示標題與完整內文', () => {
        renderDetail()

        expect(screen.getByRole('heading', { name: '颱風來襲' })).toBeInTheDocument()
        expect(screen.getByText('這是完整內文')).toBeInTheDocument()
    })

    it('有完整內文時不顯示原文連結', () => {
        renderDetail()

        expect(screen.queryByRole('link', { name: /閱讀完整原文/ })).not.toBeInTheDocument()
    })

    it.each([
        ['付費方案才有內文', 'ONLY AVAILABLE IN PAID PLANS'],
        ['內文是空白', '   '],
        ['沒有內文', ''],
    ])('%s 時退回顯示摘要，並提供原文連結', (_label, content) => {
        renderDetail(makeArticle({ content }))

        expect(screen.getByText('這是摘要')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /閱讀完整原文/ })).toHaveAttribute(
            'href',
            'https://example.com/full'
        )
    })

    it('沒有原文連結時不顯示連結', () => {
        renderDetail(makeArticle({ content: '', link: undefined }))

        expect(screen.queryByRole('link', { name: /閱讀完整原文/ })).not.toBeInTheDocument()
    })

    it('沒有圖片時使用預設圖', () => {
        renderDetail(makeArticle({ image_url: '' }))

        expect(screen.getByRole('img')).toHaveAttribute('src', '/images/no-image.jpg')
    })

    it('圖片的替代文字用標題', () => {
        renderDetail()

        expect(screen.getByRole('img', { name: '颱風來襲' })).toBeInTheDocument()
    })
})

describe('NewsDetail 互動', () => {
    it('點關閉鈕時通知外層', async () => {
        const onClose = vi.fn()
        renderDetail(makeArticle(), { onClose })

        await userEvent.click(screen.getByRole('button', { name: '關閉新聞詳情' }))

        expect(onClose).toHaveBeenCalledOnce()
    })

    it('把文章資訊與使用者原本的評分帶給評論區', () => {
        renderDetail(makeArticle({ userRate: 3 }))

        expect(CommentSection).toHaveBeenCalledWith(
            expect.objectContaining({
                postId: 'news-1',
                postTitle: '颱風來襲',
                initialRating: 3,
            }),
            undefined
        )
    })

    it('使用者還沒評分時初始分數為 0', () => {
        renderDetail(makeArticle({ userRate: undefined }))

        expect(CommentSection).toHaveBeenCalledWith(
            expect.objectContaining({ initialRating: 0 }),
            undefined
        )
    })

    it('沒有文章時不渲染評論區', () => {
        renderDetail(null)

        expect(CommentSection).not.toHaveBeenCalled()
    })
})
