import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from '@/components/molecules/Modal'

describe('Modal', () => {
    it('關閉時不渲染內容', () => {
        render(
            <Modal open={false} onClose={vi.fn()}>
                <p>內容</p>
            </Modal>
        )

        expect(screen.queryByText('內容')).not.toBeInTheDocument()
    })

    it('開啟時渲染內容', () => {
        render(
            <Modal open onClose={vi.fn()}>
                <p>內容</p>
            </Modal>
        )

        expect(screen.getByText('內容')).toBeInTheDocument()
    })

    it('透過 portal 掛在 body 底下，避免被父層的 overflow 或 z-index 裁切', () => {
        const { container } = render(
            <Modal open onClose={vi.fn()}>
                <p>內容</p>
            </Modal>
        )

        expect(container).toBeEmptyDOMElement()
        expect(document.body).toContainElement(screen.getByText('內容'))
    })

    it('開啟時鎖住背景捲動', () => {
        render(
            <Modal open onClose={vi.fn()}>
                <p>內容</p>
            </Modal>
        )

        expect(document.body.style.overflow).toBe('hidden')
    })

    it('關閉時解除背景捲動鎖定', () => {
        const { rerender } = render(
            <Modal open onClose={vi.fn()}>
                <p>內容</p>
            </Modal>
        )
        rerender(
            <Modal open={false} onClose={vi.fn()}>
                <p>內容</p>
            </Modal>
        )

        expect(document.body.style.overflow).toBe('')
    })

    it('卸載時把背景捲動還原，不會讓整頁卡住', () => {
        const { unmount } = render(
            <Modal open onClose={vi.fn()}>
                <p>內容</p>
            </Modal>
        )
        unmount()

        expect(document.body.style.overflow).toBe('')
    })

    it('點背景關閉', async () => {
        const onClose = vi.fn()
        render(
            <Modal open onClose={onClose}>
                <p>內容</p>
            </Modal>
        )

        await userEvent.click(screen.getByText('內容').parentElement!.parentElement!)

        expect(onClose).toHaveBeenCalledOnce()
    })

    it('點內容本身不會關閉', async () => {
        const onClose = vi.fn()
        render(
            <Modal open onClose={onClose}>
                <p>內容</p>
            </Modal>
        )

        await userEvent.click(screen.getByText('內容'))

        expect(onClose).not.toHaveBeenCalled()
    })
})
