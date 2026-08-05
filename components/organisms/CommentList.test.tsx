import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CommentType } from '@/types/news'

const useSession = vi.hoisted(() => vi.fn())
vi.mock('next-auth/react', () => ({ useSession }))

const CommentList = (await import('@/components/organisms/CommentList')).default

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

const signedInAs = (id: string | undefined) =>
    useSession.mockReturnValue({ data: id ? { user: { id } } : null, status: 'authenticated' })

describe('CommentList 顯示', () => {
    it('沒有評論時顯示邀請留言的提示', () => {
        signedInAs(undefined)
        render(<CommentList comments={[]} />)

        expect(screen.getByText('目前還沒有評論，成為第一個留言的人吧！')).toBeInTheDocument()
    })

    it('顯示評論者、內容與星等', () => {
        signedInAs(undefined)
        render(<CommentList comments={[makeComment()]} />)

        expect(screen.getByText('阿明')).toBeInTheDocument()
        expect(screen.getByText('很棒的報導')).toBeInTheDocument()
        expect(screen.getByRole('img', { name: '評分 4 顆星' })).toBeInTheDocument()
    })

    it('沒有評分的留言不顯示星等', () => {
        signedInAs(undefined)
        render(<CommentList comments={[makeComment({ rating: 0 })]} />)

        expect(screen.queryByRole('img', { name: /評分/ })).not.toBeInTheDocument()
    })

    it('只給評分沒寫內容的留言也能顯示', () => {
        signedInAs(undefined)
        render(<CommentList comments={[makeComment({ content: '' })]} />)

        expect(screen.getByRole('img', { name: '評分 4 顆星' })).toBeInTheDocument()
    })
})

describe('CommentList 星等篩選', () => {
    const comments = [
        makeComment({ _id: 'c1', content: '五星評論', rating: 5 }),
        makeComment({ _id: 'c2', content: '三星評論', rating: 3 }),
    ]

    it('預設顯示全部評論', () => {
        signedInAs(undefined)
        render(<CommentList comments={comments} />)

        expect(screen.getByRole('button', { name: '全部' })).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByText('五星評論')).toBeInTheDocument()
        expect(screen.getByText('三星評論')).toBeInTheDocument()
    })

    it('選擇星等後只留該星等的評論', async () => {
        signedInAs(undefined)
        render(<CommentList comments={comments} />)

        await userEvent.click(screen.getByRole('button', { name: '5' }))

        expect(screen.getByText('五星評論')).toBeInTheDocument()
        expect(screen.queryByText('三星評論')).not.toBeInTheDocument()
    })

    it('再點一次同一個星等會取消篩選', async () => {
        signedInAs(undefined)
        render(<CommentList comments={comments} />)

        await userEvent.click(screen.getByRole('button', { name: '5' }))
        await userEvent.click(screen.getByRole('button', { name: '5' }))

        expect(screen.getByText('三星評論')).toBeInTheDocument()
    })

    it('點「全部」回到未篩選狀態', async () => {
        signedInAs(undefined)
        render(<CommentList comments={comments} />)

        await userEvent.click(screen.getByRole('button', { name: '5' }))
        await userEvent.click(screen.getByRole('button', { name: '全部' }))

        expect(screen.getByText('三星評論')).toBeInTheDocument()
    })

    it('該星等沒有評論時顯示對應的空狀態', async () => {
        signedInAs(undefined)
        render(<CommentList comments={comments} />)

        await userEvent.click(screen.getByRole('button', { name: '1' }))

        expect(screen.getByText('目前沒有 1 顆星的評論')).toBeInTheDocument()
    })
})

describe('CommentList 刪除', () => {
    it('只有自己的評論才顯示刪除鈕', () => {
        signedInAs('u1')
        render(
            <CommentList
                comments={[
                    makeComment({ _id: 'mine', userId: 'u1' }),
                    makeComment({ _id: 'others', userId: 'u2' }),
                ]}
                onDelete={vi.fn()}
            />
        )

        expect(screen.getAllByRole('button', { name: '刪除評論' })).toHaveLength(1)
    })

    it('未登入時不顯示任何刪除鈕', () => {
        signedInAs(undefined)
        render(<CommentList comments={[makeComment()]} onDelete={vi.fn()} />)

        expect(screen.queryByRole('button', { name: '刪除評論' })).not.toBeInTheDocument()
    })

    it('沒有提供 onDelete 時不顯示刪除鈕', () => {
        signedInAs('u1')
        render(<CommentList comments={[makeComment({ userId: 'u1' })]} />)

        expect(screen.queryByRole('button', { name: '刪除評論' })).not.toBeInTheDocument()
    })

    it('點刪除時帶出該評論的 id', async () => {
        signedInAs('u1')
        const onDelete = vi.fn()
        render(
            <CommentList
                comments={[makeComment({ _id: 'c9', userId: 'u1' })]}
                onDelete={onDelete}
            />
        )

        await userEvent.click(screen.getByRole('button', { name: '刪除評論' }))

        expect(onDelete).toHaveBeenCalledWith('c9')
    })
})
