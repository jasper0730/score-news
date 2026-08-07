import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmDialog from '@/components/molecules/ConfirmDialog'

const renderDialog = (props = {}) =>
    render(
        <ConfirmDialog
            open
            title="刪除這則評論？"
            onConfirm={vi.fn()}
            onCancel={vi.fn()}
            {...props}
        />
    )

describe('ConfirmDialog', () => {
    it('關閉時不渲染', () => {
        renderDialog({ open: false })

        expect(screen.queryByText('刪除這則評論？')).not.toBeInTheDocument()
    })

    it('顯示標題與說明', () => {
        renderDialog({ description: '這個動作無法復原。' })

        expect(screen.getByText('刪除這則評論？')).toBeInTheDocument()
        expect(screen.getByText('這個動作無法復原。')).toBeInTheDocument()
    })

    it('是 alertdialog，且標題與說明有關聯', () => {
        renderDialog({ description: '這個動作無法復原。' })

        const dialog = screen.getByRole('alertdialog')
        expect(dialog).toHaveAttribute('aria-modal', 'true')
        expect(dialog).toHaveAccessibleName('刪除這則評論？')
        expect(dialog).toHaveAccessibleDescription('這個動作無法復原。')
    })

    it('確認時呼叫 onConfirm', async () => {
        const onConfirm = vi.fn()
        renderDialog({ onConfirm })

        await userEvent.click(screen.getByRole('button', { name: '確認' }))

        expect(onConfirm).toHaveBeenCalledOnce()
    })

    it('取消時呼叫 onCancel，不會誤觸 onConfirm', async () => {
        const onConfirm = vi.fn()
        const onCancel = vi.fn()
        renderDialog({ onConfirm, onCancel })

        await userEvent.click(screen.getByRole('button', { name: '取消' }))

        expect(onCancel).toHaveBeenCalledOnce()
        expect(onConfirm).not.toHaveBeenCalled()
    })

    it('可以自訂按鈕文字', () => {
        renderDialog({ confirmLabel: '送出', cancelLabel: '再想想' })

        expect(screen.getByRole('button', { name: '送出' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '再想想' })).toBeInTheDocument()
    })

    describe('處理中', () => {
        it('顯示進行中並停用兩個按鈕，避免重複送出', async () => {
            let resolveConfirm: () => void = () => {}
            const onConfirm = vi.fn(() => new Promise<void>((r) => (resolveConfirm = r)))
            renderDialog({ onConfirm })

            await userEvent.click(screen.getByRole('button', { name: '確認' }))

            expect(screen.getByRole('button', { name: '處理中...' })).toBeDisabled()
            expect(screen.getByRole('button', { name: '取消' })).toBeDisabled()

            await userEvent.click(screen.getByRole('button', { name: '處理中...' }))
            expect(onConfirm).toHaveBeenCalledOnce()

            resolveConfirm()
            await waitFor(() => expect(screen.getByRole('button', { name: '確認' })).toBeEnabled())
        })

        it('處理中點背景不會關閉——中途關掉會讓使用者不知道結果', async () => {
            const onCancel = vi.fn()
            renderDialog({
                onCancel,
                onConfirm: vi.fn(() => new Promise<void>(() => {})),
            })
            await userEvent.click(screen.getByRole('button', { name: '確認' }))

            await userEvent.click(screen.getByRole('alertdialog').parentElement!.parentElement!)

            expect(onCancel).not.toHaveBeenCalled()
        })
    })
})
