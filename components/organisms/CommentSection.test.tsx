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
        createdAt: new Date().toISOString(),
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

/** 星星是 svg，只能從 document 取 */
const clickStar = (n: number) => userEvent.click(document.querySelectorAll('svg')[n - 1] as Element)

/**
 * 自己的評論會同時出現在列表與編輯框裡，
 * 直接用 findByText 會同時命中 <p> 與 <textarea>，所以限定在列表的段落上。
 */
const findCommentText = (text: string) => screen.findByText(text, { selector: 'p' })
const queryCommentText = (text: string) => screen.queryByText(text, { selector: 'p' })

/** 按下確認彈窗上的按鈕 */
const confirmWith = (name: string) => userEvent.click(screen.getByRole('button', { name }))

beforeEach(() => {
    signIn('u1')
    getCommentsByPostId.mockResolvedValue({ success: true, comments: [] })
    createCommentAction.mockResolvedValue({
        success: true,
        comment: makeComment(),
        rating: { averageRating: 4.5, userRating: 5 },
    })
    deleteCommentAction.mockResolvedValue({
        success: true,
        rating: { averageRating: 0, userRating: 0 },
    })
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

        expect(await findCommentText('寫得好')).toBeInTheDocument()
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

describe('CommentSection 新增表單', () => {
    it('未登入時不顯示', async () => {
        signIn(undefined)
        renderSection()

        await waitFor(() => expect(getCommentsByPostId).toHaveBeenCalled())
        expect(screen.queryByRole('textbox', { name: '評論內容' })).not.toBeInTheDocument()
    })

    it('登入且尚未評論過時顯示', async () => {
        renderSection()

        expect(await screen.findByRole('textbox', { name: '評論內容' })).toBeInTheDocument()
    })

    it('已經評論過就不顯示——一人一則，留著只會覆蓋掉舊的', async () => {
        // 要改內容應該用列表裡那則的編輯鈕
        getCommentsByPostId.mockResolvedValue({
            success: true,
            comments: [makeComment({ userId: 'u1' })],
        })
        renderSection()

        await findCommentText('很棒的報導')
        expect(screen.queryByRole('button', { name: '送出評論' })).not.toBeInTheDocument()
    })
})

describe('CommentSection 送出評論', () => {
    it('先跳確認彈窗，還沒打 API', async () => {
        renderSection()
        await screen.findByRole('textbox', { name: '評論內容' })

        await clickStar(5)
        await userEvent.click(screen.getByRole('button', { name: '送出評論' }))

        expect(screen.getByRole('alertdialog')).toHaveAccessibleName('送出評論？')
        expect(createCommentAction).not.toHaveBeenCalled()
    })

    it('確認後才送出，並帶上內容與評分', async () => {
        const onRatingUpdate = vi.fn()
        renderSection({ onRatingUpdate })
        await screen.findByRole('textbox', { name: '評論內容' })

        await clickStar(5)
        await userEvent.type(screen.getByRole('textbox', { name: '評論內容' }), '很棒')
        await userEvent.click(screen.getByRole('button', { name: '送出評論' }))
        await confirmWith('送出')

        await waitFor(() =>
            expect(createCommentAction).toHaveBeenCalledWith('news-1', '標題', '很棒', 5)
        )
        // 平均由伺服器算好回傳，不是前端拿使用者剛給的分數當平均
        expect(onRatingUpdate).toHaveBeenCalledWith('news-1', { averageRating: 4.5, userRating: 5 })
    })

    it('取消就不打 API', async () => {
        renderSection()
        await screen.findByRole('textbox', { name: '評論內容' })

        await clickStar(5)
        await userEvent.click(screen.getByRole('button', { name: '送出評論' }))
        await confirmWith('取消')

        expect(createCommentAction).not.toHaveBeenCalled()
        // Modal 靠 AnimatePresence 的離場動畫卸載，不是同步消失
        await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    })

    it('送出成功後重新取列表並清空表單', async () => {
        renderSection()
        await screen.findByRole('textbox', { name: '評論內容' })

        await clickStar(5)
        await userEvent.type(screen.getByRole('textbox', { name: '評論內容' }), '很棒')
        await userEvent.click(screen.getByRole('button', { name: '送出評論' }))
        await confirmWith('送出')

        await waitFor(() => expect(getCommentsByPostId).toHaveBeenCalledTimes(2))
        expect(toastBox).toHaveBeenCalledWith('評論已送出', 'success')
    })

    it('送出失敗時提示伺服器給的訊息', async () => {
        createCommentAction.mockResolvedValue({ success: false, error: '這則評論已被管理員下架' })
        renderSection()
        await screen.findByRole('textbox', { name: '評論內容' })

        await clickStar(5)
        await userEvent.click(screen.getByRole('button', { name: '送出評論' }))
        await confirmWith('送出')

        await waitFor(() =>
            expect(toastBox).toHaveBeenCalledWith('這則評論已被管理員下架', 'error')
        )
    })

    it('server action 丟出例外時也提示錯誤而不是整頁崩潰', async () => {
        createCommentAction.mockRejectedValue(new Error('boom'))
        renderSection()
        await screen.findByRole('textbox', { name: '評論內容' })

        await clickStar(5)
        await userEvent.click(screen.getByRole('button', { name: '送出評論' }))
        await confirmWith('送出')

        await waitFor(() => expect(toastBox).toHaveBeenCalledWith('評論失敗，請稍後再試', 'error'))
    })
})

describe('CommentSection 編輯評論', () => {
    beforeEach(() => {
        getCommentsByPostId.mockResolvedValue({
            success: true,
            comments: [makeComment({ _id: 'c1', userId: 'u1', content: '原本的內容' })],
        })
    })

    it('自己的評論才有編輯鈕', async () => {
        renderSection()

        expect(await screen.findByRole('button', { name: '編輯評論' })).toBeInTheDocument()
    })

    it('別人的評論沒有編輯鈕——管理員的權限是下架，不是改別人的話', async () => {
        signIn('u1', true)
        getCommentsByPostId.mockResolvedValue({
            success: true,
            comments: [makeComment({ userId: 'u2' })],
        })
        renderSection()

        await findCommentText('很棒的報導')
        expect(screen.queryByRole('button', { name: '編輯評論' })).not.toBeInTheDocument()
    })

    it('點編輯後就地變成表單，並帶入原內容', async () => {
        renderSection()

        await userEvent.click(await screen.findByRole('button', { name: '編輯評論' }))

        expect(screen.getByRole('textbox', { name: '評論內容' })).toHaveValue('原本的內容')
        expect(screen.getByRole('button', { name: '儲存修改' })).toBeInTheDocument()
    })

    it('取消編輯回到原本的顯示', async () => {
        renderSection()
        await userEvent.click(await screen.findByRole('button', { name: '編輯評論' }))

        await userEvent.click(screen.getByRole('button', { name: '取消' }))

        expect(screen.queryByRole('textbox', { name: '評論內容' })).not.toBeInTheDocument()
        expect(await findCommentText('原本的內容')).toBeInTheDocument()
    })

    it('儲存前先跳確認彈窗', async () => {
        renderSection()
        await userEvent.click(await screen.findByRole('button', { name: '編輯評論' }))

        await userEvent.click(screen.getByRole('button', { name: '儲存修改' }))

        expect(screen.getByRole('alertdialog')).toHaveAccessibleName('儲存修改？')
        expect(createCommentAction).not.toHaveBeenCalled()
    })

    it('確認後送出修改並退出編輯模式', async () => {
        renderSection()
        await userEvent.click(await screen.findByRole('button', { name: '編輯評論' }))
        await userEvent.clear(screen.getByRole('textbox', { name: '評論內容' }))
        await userEvent.type(screen.getByRole('textbox', { name: '評論內容' }), '改過的內容')

        await userEvent.click(screen.getByRole('button', { name: '儲存修改' }))
        await confirmWith('儲存')

        await waitFor(() =>
            expect(createCommentAction).toHaveBeenCalledWith('news-1', '標題', '改過的內容', 4)
        )
        await waitFor(() =>
            expect(screen.queryByRole('button', { name: '儲存修改' })).not.toBeInTheDocument()
        )
    })
})

describe('CommentSection 刪除評論', () => {
    beforeEach(() => {
        getCommentsByPostId.mockResolvedValue({
            success: true,
            comments: [makeComment({ _id: 'c1', userId: 'u1', content: '要刪掉的' })],
        })
    })

    it('先跳確認彈窗，還沒打 API', async () => {
        renderSection()
        await findCommentText('要刪掉的')

        await userEvent.click(screen.getByRole('button', { name: '刪除評論' }))

        expect(screen.getByRole('alertdialog')).toHaveAccessibleName('刪除這則評論？')
        expect(deleteCommentAction).not.toHaveBeenCalled()
    })

    it('取消就不刪', async () => {
        renderSection()
        await findCommentText('要刪掉的')

        await userEvent.click(screen.getByRole('button', { name: '刪除評論' }))
        await confirmWith('取消')

        expect(deleteCommentAction).not.toHaveBeenCalled()
        expect(await findCommentText('要刪掉的')).toBeInTheDocument()
    })

    it('確認後刪除並重新取一次列表——軟刪除的結果由伺服器決定', async () => {
        renderSection()
        await findCommentText('要刪掉的')

        getCommentsByPostId.mockResolvedValue({ success: true, comments: [] })
        await userEvent.click(screen.getByRole('button', { name: '刪除評論' }))
        await confirmWith('刪除')

        await waitFor(() => expect(queryCommentText('要刪掉的')).not.toBeInTheDocument())
        expect(deleteCommentAction).toHaveBeenCalledWith('c1')
        expect(toastBox).toHaveBeenCalledWith('評論已刪除', 'success')
    })

    it('管理員刪別人的評論時，彈窗特別點出身分', async () => {
        signIn('u1', true)
        getCommentsByPostId.mockResolvedValue({
            success: true,
            comments: [makeComment({ _id: 'c1', userId: 'u2', content: '違規內容' })],
        })
        renderSection()
        await findCommentText('違規內容')

        await userEvent.click(screen.getByRole('button', { name: /刪除評論/ }))

        expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription(
            '你正以管理員身分刪除他人的評論，這個動作無法復原。'
        )
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
        await confirmWith('刪除')

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
})
