import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CommentForm from '@/components/molecules/CommentForm'

const getTextarea = () => screen.getByRole('textbox', { name: '評論內容' })
const getSubmit = () => screen.getByRole('button', { name: /送出評論|修改評論|傳送中/ })

/** 星星是 svg，只能從容器裡取 */
const clickStar = (container: HTMLElement, n: number) =>
    userEvent.click(container.querySelectorAll('svg')[n - 1]!)

describe('CommentForm', () => {
    it('沒有評分時送出鈕是停用的', () => {
        render(<CommentForm onSubmit={vi.fn()} />)

        expect(getSubmit()).toBeDisabled()
    })

    it('給了評分後才能送出', async () => {
        const { container } = render(<CommentForm onSubmit={vi.fn()} />)

        await clickStar(container, 4)

        expect(getSubmit()).toBeEnabled()
    })

    it('評分是必填、評論內容選填', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        const { container } = render(<CommentForm onSubmit={onSubmit} />)

        await clickStar(container, 5)
        await userEvent.click(getSubmit())

        expect(onSubmit).toHaveBeenCalledWith('', 5)
    })

    it('送出時把內容去除前後空白', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        const { container } = render(<CommentForm onSubmit={onSubmit} />)

        await clickStar(container, 3)
        await userEvent.type(getTextarea(), '  很棒的報導  ')
        await userEvent.click(getSubmit())

        expect(onSubmit).toHaveBeenCalledWith('很棒的報導', 3)
    })

    it('Ctrl+Enter 直接送出', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        const { container } = render(<CommentForm onSubmit={onSubmit} />)

        await clickStar(container, 3)
        await userEvent.type(getTextarea(), '很棒{Control>}{Enter}{/Control}')

        expect(onSubmit).toHaveBeenCalledWith('很棒', 3)
    })

    it('單純按 Enter 只換行、不送出', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        const { container } = render(<CommentForm onSubmit={onSubmit} />)

        await clickStar(container, 3)
        await userEvent.type(getTextarea(), '第一行{Enter}第二行')

        expect(onSubmit).not.toHaveBeenCalled()
        expect(getTextarea()).toHaveValue('第一行\n第二行')
    })

    it('沒有評分時 Ctrl+Enter 也不會送出', async () => {
        const onSubmit = vi.fn()
        render(<CommentForm onSubmit={onSubmit} />)

        await userEvent.type(getTextarea(), '很棒{Control>}{Enter}{/Control}')

        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('送出中顯示提示並停用按鈕，避免重複送出', async () => {
        let resolveSubmit: () => void = () => {}
        const onSubmit = vi.fn(() => new Promise<void>((resolve) => (resolveSubmit = resolve)))
        const { container } = render(<CommentForm onSubmit={onSubmit} />)

        await clickStar(container, 3)
        await userEvent.click(getSubmit())

        expect(screen.getByRole('button', { name: '傳送中...' })).toBeDisabled()

        await userEvent.click(screen.getByRole('button', { name: '傳送中...' }))
        expect(onSubmit).toHaveBeenCalledOnce()

        resolveSubmit()
        await waitFor(() => expect(getSubmit()).toBeEnabled())
    })

    it('顯示目前字數與上限', async () => {
        render(<CommentForm onSubmit={vi.fn()} />)
        expect(screen.getByText('0/500')).toBeInTheDocument()

        await userEvent.type(getTextarea(), '很棒')

        expect(screen.getByText('2/500')).toBeInTheDocument()
    })

    it('輸入長度受 maxLength 限制', () => {
        render(<CommentForm onSubmit={vi.fn()} />)

        expect(getTextarea()).toHaveAttribute('maxLength', '500')
    })

    it('帶入既有評論時預填內容與評分，並顯示為修改', () => {
        const { container } = render(
            <CommentForm initialContent="舊評論" initialRating={4} onSubmit={vi.fn()} />
        )

        expect(getTextarea()).toHaveValue('舊評論')
        expect(container.querySelectorAll('.text-star')).toHaveLength(4)
        expect(screen.getByRole('button', { name: '修改評論' })).toBeInTheDocument()
    })
})
