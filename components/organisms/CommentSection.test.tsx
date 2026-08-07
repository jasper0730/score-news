import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CommentType } from '@/types/news'

const useSession = vi.hoisted(() => vi.fn())
vi.mock('next-auth/react', () => ({ useSession }))

const getCommentsByPostId = vi.hoisted(() => vi.fn())
const createCommentAction = vi.hoisted(() => vi.fn())
const deleteCommentAction = vi.hoisted(() => vi.fn())
vi.mock('@/actions/commentActions', () => ({
    getCommentsByPostId,
    createCommentAction,
    deleteCommentAction,
}))

const toastBox = vi.hoisted(() => vi.fn())
vi.mock('@/utils/toast', () => ({ toastBox }))

const CommentSection = (await import('@/components/organisms/CommentSection')).default

function makeComment(overrides: Partial<CommentType> = {}): CommentType {
    return {
        _id: 'c1',
        userId: 'u1',
        userName: '阿明',
        userImage: '',
        postId: 'news-1',
        postTitle: '標題',
        content: '很棒的報導',
        rating: 4,
        createdAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    }
}

const signIn = (id?: string, isAdmin = false) =>
    useSession.mockReturnValue({
        data: id ? { user: { id, isAdmin } } : null,
        status: id ? 'authenticated' : 'unauthenticated',
    })

const renderSection = (props = {}) =>
    render(<CommentSection postId="news-1" postTitle="標題" {...props} />)

const clickStar = (n: number) => userEvent.click(document.querySelectorAll('svg')[n - 1] as Element)

/**
 * 自己的評論會同時出現在列表與（預填的）編輯框裡，
 * 直接用 findByText 會同時命中 <p> 與 <textarea>，所以限定在列表的段落上。
 */
const findCommentText = (text: string) => screen.findByText(text, { selector: 'p' })
const queryCommentText = (text: string) => screen.queryByText(text, { selector: 'p' })

beforeEach(() => {
    signIn('u1')
    getCommentsByPostId.mockResolvedValue({ success: true, comments: [] })
    createCommentAction.mockResolvedValue({ success: true, comment: makeComment() })
    deleteCommentAction.mockResolvedValue({ success: true })
})

describe('CommentSection 載入', () => {
    it('掛載時依文章 id 取評論', async () => {
        renderSection()

        await waitFor(() => expect(getCommentsByPostId).toHaveBeenCalledWith('news-1'))
    })

    it('載入完成後顯示評論數與內容', async () => {
        getCommentsByPostId.mockResolvedValue({
            success: true,
            comments: [makeComment({ userId: 'u2', content: '寫得好' })],
        })
        renderSection()

        expect(await screen.findByText('寫得好')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: '評論 (1)' })).toBeInTheDocument()
    })

    it('載入中先顯示提示', () => {
        getCommentsByPostId.mockReturnValue(new Promise(() => {}))
        renderSection()

        expect(screen.getByText('載入評論中...')).toBeInTheDocument()
    })

    it('取評論失敗時仍結束載入狀態，不會卡住', async () => {
        getCommentsByPostId.mockRejectedValue(new Error('boom'))
        renderSection()

        await waitFor(() => expect(screen.queryByText('載入評論中...')).not.toBeInTheDocument())
    })
})

describe('CommentSection 權限', () => {
    it('未登入時不顯示評論表單', async () => {
        signIn(undefined)
        renderSection()

        await waitFor(() => expect(getCommentsByPostId).toHaveBeenCalled())
        expect(screen.queryByRole('textbox', { name: '評論內容' })).not.toBeInTheDocument()
    })

    it('登入後才顯示評論表單', async () => {
        renderSection()

        expect(await screen.findByRole('textbox', { name: '評論內容' })).toBeInTheDocument()
    })
})

describe('CommentSection 送出評論', () => {
    it('把內容與評分送出，並先樂觀更新分數', async () => {
        const onRatingUpdate = vi.fn()
        renderSection({ onRatingUpdate })
        await screen.findByRole('textbox', { name: '評論內容' })

        await clickStar(5)
        await userEvent.type(screen.getByRole('textbox', { name: '評論內容' }), '很棒')
        await userEvent.click(screen.getByRole('button', { name: '送出評論' }))

        await waitFor(() =>
            expect(createCommentAction).toHaveBeenCalledWith('news-1', '標題', '很棒', 5)
        )
        expect(onRatingUpdate).toHaveBeenCalledWith('news-1', 5)
    })

    it('新評論加到列表最前面', async () => {
        getCommentsByPostId.mockResolvedValue({
            success: true,
            comments: [makeComment({ _id: 'old', userId: 'u2', content: '舊評論' })],
        })
        createCommentAction.mockResolvedValue({
            success: true,
            comment: makeComment({ _id: 'new', userId: 'u1', content: '新評論' }),
        })
        renderSection()
        await screen.findByRole('textbox', { name: '評論內容' })

        await clickStar(5)
        await userEvent.click(screen.getByRole('button', { name: '送出評論' }))

        expect(await findCommentText('新評論')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: '評論 (2)' })).toBeInTheDocument()
    })

    it('已評論過的人再送出是修改原本那則，不會多一筆', async () => {
        getCommentsByPostId.mockResolvedValue({
            success: true,
            comments: [makeComment({ _id: 'c1', userId: 'u1', content: '舊內容' })],
        })
        createCommentAction.mockResolvedValue({
            success: true,
            comment: makeComment({ _id: 'c1', userId: 'u1', content: '改過的內容' }),
        })
        renderSection()

        // 已有自己的評論時，表單顯示為「修改評論」並帶入原內容
        expect(await screen.findByRole('button', { name: '修改評論' })).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', { name: '修改評論' }))

        expect(await findCommentText('改過的內容')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: '評論 (1)' })).toBeInTheDocument()
        expect(toastBox).toHaveBeenCalledWith('評論已更新', 'success')
    })

    it('送出失敗時提示錯誤', async () => {
        createCommentAction.mockResolvedValue({ success: false })
        renderSection()
        await screen.findByRole('textbox', { name: '評論內容' })

        await clickStar(5)
        await userEvent.click(screen.getByRole('button', { name: '送出評論' }))

        await waitFor(() => expect(toastBox).toHaveBeenCalledWith('評論失敗，請稍後再試', 'error'))
    })

    it('server action 丟出例外時也提示錯誤而不是整頁崩潰', async () => {
        createCommentAction.mockRejectedValue(new Error('boom'))
        renderSection()
        await screen.findByRole('textbox', { name: '評論內容' })

        await clickStar(5)
        await userEvent.click(screen.getByRole('button', { name: '送出評論' }))

        await waitFor(() => expect(toastBox).toHaveBeenCalledWith('評論失敗，請稍後再試', 'error'))
    })
})

describe('CommentSection 刪除評論', () => {
    it('刪除成功後重新取一次列表——軟刪除的結果由伺服器決定', async () => {
        // 本人自刪會消失、管理員下架會變成墓碑，在前端猜不如重新問一次
        getCommentsByPostId.mockResolvedValueOnce({
            success: true,
            comments: [makeComment({ _id: 'c1', userId: 'u1', content: '要刪掉的' })],
        })
        renderSection()
        await findCommentText('要刪掉的')

        getCommentsByPostId.mockResolvedValue({ success: true, comments: [] })
        await userEvent.click(screen.getByRole('button', { name: '刪除評論' }))

        await waitFor(() => expect(queryCommentText('要刪掉的')).not.toBeInTheDocument())
        expect(deleteCommentAction).toHaveBeenCalledWith('c1')
        expect(getCommentsByPostId).toHaveBeenCalledTimes(2)
        expect(toastBox).toHaveBeenCalledWith('評論已刪除', 'success')
    })

    it('管理員下架後該則變成墓碑而不是消失', async () => {
        signIn('u1', true)
        getCommentsByPostId.mockResolvedValueOnce({
            success: true,
            comments: [makeComment({ _id: 'c1', userId: 'u2', content: '違規內容' })],
        })
        renderSection()
        await findCommentText('違規內容')

        getCommentsByPostId.mockResolvedValue({
            success: true,
            comments: [
                makeComment({ _id: 'c1', userId: 'u2', content: '', isRemovedByAdmin: true }),
            ],
        })
        await userEvent.click(screen.getByRole('button', { name: /刪除評論/ }))

        expect(await screen.findByText('該評論因違反社群規範已被管理員隱藏')).toBeInTheDocument()
        expect(queryCommentText('違規內容')).not.toBeInTheDocument()
    })

    it('自己的評論被下架時不給重新發表，表單換成說明', async () => {
        getCommentsByPostId.mockResolvedValue({
            success: true,
            comments: [makeComment({ _id: 'c1', userId: 'u1', isRemovedByAdmin: true })],
        })
        renderSection()

        expect(
            await screen.findByText('你的評論因違反社群規範已被管理員隱藏，無法重新發表。')
        ).toBeInTheDocument()
        expect(screen.queryByRole('textbox', { name: '評論內容' })).not.toBeInTheDocument()
    })

    it('刪除失敗時保留該則評論', async () => {
        deleteCommentAction.mockResolvedValue({ success: false })
        getCommentsByPostId.mockResolvedValue({
            success: true,
            comments: [makeComment({ _id: 'c1', userId: 'u1', content: '刪不掉的' })],
        })
        renderSection()
        await findCommentText('刪不掉的')

        await userEvent.click(screen.getByRole('button', { name: '刪除評論' }))

        await waitFor(() => expect(deleteCommentAction).toHaveBeenCalled())
        expect(queryCommentText('刪不掉的')).toBeInTheDocument()
    })
})
