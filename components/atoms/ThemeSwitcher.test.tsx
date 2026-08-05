import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const setTheme = vi.hoisted(() => vi.fn())
const useTheme = vi.hoisted(() => vi.fn())
vi.mock('next-themes', () => ({ useTheme }))

const ThemeSwitcher = (await import('@/components/atoms/ThemeSwitcher')).default

const getButton = () => screen.getByRole('button', { name: '切換深淺色主題' })

beforeEach(() => {
    useTheme.mockReturnValue({ setTheme, resolvedTheme: 'light' })
})

describe('ThemeSwitcher', () => {
    it('兩個圖示都輸出，由 CSS 決定顯示哪一個', () => {
        // 用 JS 判斷該畫哪個圖示會 hydration mismatch，
        // 常見的 mounted 保險又會讓圖示延遲到掛載後才出現
        const { container } = render(<ThemeSwitcher />)

        expect(container.querySelectorAll('svg')).toHaveLength(2)
        expect(container.querySelector('.hidden.dark\\:block')).toBeInTheDocument()
        expect(container.querySelector('.block.dark\\:hidden')).toBeInTheDocument()
    })

    it('目前是淺色時切成深色', async () => {
        render(<ThemeSwitcher />)

        await userEvent.click(getButton())

        expect(setTheme).toHaveBeenCalledWith('dark')
    })

    it('目前是深色時切成淺色', async () => {
        useTheme.mockReturnValue({ setTheme, resolvedTheme: 'dark' })
        render(<ThemeSwitcher />)

        await userEvent.click(getButton())

        expect(setTheme).toHaveBeenCalledWith('light')
    })

    it('主題還沒解析出來時預設切到深色', async () => {
        useTheme.mockReturnValue({ setTheme, resolvedTheme: undefined })
        render(<ThemeSwitcher />)

        await userEvent.click(getButton())

        expect(setTheme).toHaveBeenCalledWith('dark')
    })
})
