import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const signOut = vi.hoisted(() => vi.fn())
const signIn = vi.hoisted(() => vi.fn())
vi.mock('next-auth/react', () => ({ signOut, signIn }))

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}))

const RegisterButton = (await import('@/components/organisms/RegisterButton')).default

describe('RegisterButton 登出模式', () => {
    it('顯示登出按鈕', () => {
        render(<RegisterButton type="logout" />)

        expect(screen.getByRole('button', { name: '登出' })).toBeInTheDocument()
    })

    it('點擊後登出並導回首頁', async () => {
        render(<RegisterButton type="logout" />)

        await userEvent.click(screen.getByRole('button', { name: '登出' }))

        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' })
    })
})

describe('RegisterButton 登入模式', () => {
    it('預設不開啟彈窗', () => {
        render(<RegisterButton type="login" />)

        expect(screen.queryByRole('heading', { name: '登入 ScoreNews' })).not.toBeInTheDocument()
    })

    it('點擊後開啟登入彈窗', async () => {
        render(<RegisterButton type="login" />)

        await userEvent.click(screen.getByRole('button', { name: '登入' }))

        expect(screen.getByRole('heading', { name: '登入 ScoreNews' })).toBeInTheDocument()
    })

    it('可以從登入彈窗切換到註冊彈窗', async () => {
        render(<RegisterButton type="login" />)
        await userEvent.click(screen.getByRole('button', { name: '登入' }))

        await userEvent.click(screen.getByRole('button', { name: '註冊' }))

        expect(screen.getByRole('heading', { name: '創建一個帳戶' })).toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: '登入 ScoreNews' })).not.toBeInTheDocument()
    })
})
