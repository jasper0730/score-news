import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const signOut = vi.hoisted(() => vi.fn())
vi.mock('next-auth/react', () => ({ signOut }))

const UserMenu = (await import('@/components/molecules/UserMenu')).default

const getTrigger = () => screen.getByRole('button', { name: '開啟使用者選單' })

describe('UserMenu', () => {
    it('預設收合，並以 aria-expanded 表達狀態', () => {
        render(<UserMenu />)

        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false')
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('點頭像展開選單', async () => {
        render(<UserMenu />)

        await userEvent.click(getTrigger())

        expect(screen.getByRole('menu')).toBeInTheDocument()
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true')
    })

    it('再點一次收合', async () => {
        render(<UserMenu />)

        await userEvent.click(getTrigger())
        await userEvent.click(getTrigger())

        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false')
    })

    it('提供前往後台的連結', async () => {
        render(<UserMenu />)

        await userEvent.click(getTrigger())

        expect(screen.getByRole('menuitem', { name: '前往後台' })).toHaveAttribute(
            'href',
            '/dashboard'
        )
    })

    it('點選單以外的地方會收合', async () => {
        render(
            <div>
                <UserMenu />
                <button>其他地方</button>
            </div>
        )
        await userEvent.click(getTrigger())

        await userEvent.click(screen.getByRole('button', { name: '其他地方' }))

        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false')
    })

    it('按 Escape 收合並把焦點還給觸發按鈕', async () => {
        render(<UserMenu />)
        await userEvent.click(getTrigger())

        await userEvent.keyboard('{Escape}')

        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false')
        expect(getTrigger()).toHaveFocus()
    })

    it('登出後導回首頁', async () => {
        render(<UserMenu />)
        await userEvent.click(getTrigger())

        await userEvent.click(screen.getByRole('menuitem', { name: '登出' }))

        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' })
    })

    it('收合狀態下不會殘留全域事件監聽', async () => {
        const addSpy = vi.spyOn(document, 'addEventListener')
        const removeSpy = vi.spyOn(document, 'removeEventListener')
        render(<UserMenu />)

        await userEvent.click(getTrigger())
        const addedWhileOpen = addSpy.mock.calls.filter(([type]) =>
            ['mousedown', 'keydown'].includes(type)
        ).length
        await userEvent.click(getTrigger())
        const removedAfterClose = removeSpy.mock.calls.filter(([type]) =>
            ['mousedown', 'keydown'].includes(type)
        ).length

        expect(addedWhileOpen).toBeGreaterThan(0)
        expect(removedAfterClose).toBe(addedWhileOpen)
    })
})
