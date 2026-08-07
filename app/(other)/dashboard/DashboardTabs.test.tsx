import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardTabs from '@/app/(other)/dashboard/DashboardTabs'

const renderTabs = (props = {}) =>
    render(<DashboardTabs activeTab="favorites" onTabChange={vi.fn()} {...props} />)

describe('DashboardTabs', () => {
    it('顯示三個分頁', () => {
        renderTabs()

        expect(screen.getByRole('button', { name: '我的收藏' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '我的評論' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '個人資料' })).toBeInTheDocument()
    })

    it('目前分頁以 aria-current 標示，不是只靠顏色', () => {
        renderTabs({ activeTab: 'comments' })

        expect(screen.getByRole('button', { name: '我的評論' })).toHaveAttribute(
            'aria-current',
            'page'
        )
        expect(screen.getByRole('button', { name: '我的收藏' })).not.toHaveAttribute('aria-current')
    })

    it('點擊時回報要切到哪一個分頁', async () => {
        const onTabChange = vi.fn()
        renderTabs({ onTabChange })

        await userEvent.click(screen.getByRole('button', { name: '個人資料' }))

        expect(onTabChange).toHaveBeenCalledWith('profile')
    })

    it('每個分頁都有圖示，且對無障礙樹隱藏', () => {
        // 圖示純裝飾，旁邊已經有文字標籤，讀兩次是噪音
        const { container } = renderTabs()

        const icons = container.querySelectorAll('svg')
        expect(icons).toHaveLength(3)
        for (const icon of icons) expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('圖示不寫死顏色，跟著文字色走', () => {
        // 用 currentColor 才能同時跟上「未選取／選取」與深淺色主題
        const { container } = renderTabs()

        for (const icon of container.querySelectorAll('svg')) {
            expect(icon.getAttribute('fill')).toBe('currentColor')
        }
    })
})
