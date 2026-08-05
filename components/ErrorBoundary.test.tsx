import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'

const Boom = () => {
    throw new Error('元件爆炸了')
}

beforeEach(() => {
    // React 在 error boundary 攔截後仍會把錯誤印到 console，測試預期如此，不需噪音
    vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('ErrorBoundary', () => {
    it('沒有錯誤時正常顯示子元件', () => {
        render(
            <ErrorBoundary>
                <p>一切正常</p>
            </ErrorBoundary>
        )

        expect(screen.getByText('一切正常')).toBeInTheDocument()
    })

    it('子元件拋錯時顯示預設的錯誤畫面，而不是整頁白畫面', () => {
        render(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>
        )

        expect(screen.getByText('發生錯誤，請重新整理頁面。')).toBeInTheDocument()
    })

    it('可以自訂 fallback', () => {
        render(
            <ErrorBoundary fallback={<p>自訂錯誤畫面</p>}>
                <Boom />
            </ErrorBoundary>
        )

        expect(screen.getByText('自訂錯誤畫面')).toBeInTheDocument()
        expect(screen.queryByText('發生錯誤，請重新整理頁面。')).not.toBeInTheDocument()
    })

    it('把錯誤記錄下來供除錯', () => {
        render(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>
        )

        expect(console.error).toHaveBeenCalledWith(
            'ErrorBoundary caught:',
            expect.objectContaining({ message: '元件爆炸了' }),
            expect.anything()
        )
    })
})
