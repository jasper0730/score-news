'use client'

import { useState } from 'react'
import Modal from '@/components/molecules/Modal'
import Button from '@/components/atoms/Button'
import { cn } from '@/libs/cn'

interface ConfirmDialogProps {
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    /** danger 用於刪除這類不可逆的操作，確認鈕會變成警示色 */
    variant?: 'default' | 'danger'
    onConfirm: () => void | Promise<void>
    onCancel: () => void
}

const ConfirmDialog = ({
    open,
    title,
    description,
    confirmLabel = '確認',
    cancelLabel = '取消',
    variant = 'default',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) => {
    const [isPending, setIsPending] = useState(false)

    const handleConfirm = async () => {
        if (isPending) return
        setIsPending(true)
        try {
            await onConfirm()
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Modal open={open} onClose={isPending ? () => {} : onCancel} className="w-full max-w-sm">
            {/* Modal 只負責遮罩與 portal，對話框本身的語意要在這裡補齊 */}
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby={description ? 'confirm-dialog-description' : undefined}
                className="rounded-lg border bg-surface p-5 shadow-lg"
            >
                <h2 id="confirm-dialog-title" className="text-lg font-semibold">
                    {title}
                </h2>
                {description && (
                    <p
                        id="confirm-dialog-description"
                        className="mt-2 text-sm text-muted-foreground"
                    >
                        {description}
                    </p>
                )}

                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'primary' : 'brand'}
                        size="sm"
                        onClick={handleConfirm}
                        disabled={isPending}
                        className={cn(variant === 'danger' && 'border-danger text-danger')}
                    >
                        {isPending ? '處理中...' : confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

export default ConfirmDialog
