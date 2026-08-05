import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'

const dismiss = vi.hoisted(() => vi.fn())
const custom = vi.hoisted(() => vi.fn())
vi.mock('react-hot-toast', () => ({ toast: { dismiss, custom } }))

const { toastBox } = await import('@/utils/toast')

/** toast.custom 收到的是一個 render function，這裡把它渲染出來檢查 */
function renderToast(visible = true) {
    const renderFn = custom.mock.calls.at(-1)?.[0] as (t: { visible: boolean }) => ReactElement
    return render(renderFn({ visible }))
}

describe('toastBox', () => {
    it('先關掉既有的 toast，避免連續操作時疊成一整排', () => {
        toastBox('已收藏', 'success')

        expect(dismiss).toHaveBeenCalled()
        expect(custom).toHaveBeenCalledOnce()
    })

    it('顯示訊息文字', () => {
        toastBox('已收藏', 'success')
        renderToast()

        expect(screen.getByText('已收藏')).toBeInTheDocument()
    })

    it.each([
        ['success', '👌'],
        ['error', '❌'],
        ['warning', '⚠️'],
    ] as const)('%s 狀態顯示 %s', (state, emoji) => {
        toastBox('訊息', state)
        renderToast()

        expect(screen.getByText(emoji)).toBeInTheDocument()
    })

    it('顯示中與離場時套用不同動畫', () => {
        toastBox('訊息', 'success')
        const { container: entering } = renderToast(true)
        expect(entering.firstElementChild).toHaveClass('animate-enter')

        toastBox('訊息', 'success')
        const { container: leaving } = renderToast(false)
        expect(leaving.firstElementChild).toHaveClass('animate-leave')
    })
})
