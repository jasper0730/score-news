import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserType } from '@/types/user'

const signOut = vi.hoisted(() => vi.fn())
vi.mock('next-auth/react', () => ({ signOut, signIn: vi.fn() }))

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}))

const NavBar = (await import('@/app/(other)/NavBar')).default

const user: UserType = {
    id: '507f1f77bcf86cd799439011',
    name: '小明',
    email: 'ming@example.com',
    image: 'https://example.com/avatar.png',
}

const getTrigger = () => screen.getByRole('button', { name: '開啟使用者選單' })

describe('NavBar 未登入', () => {
    it('顯示登入鈕，不顯示使用者選單', () => {
        render(<NavBar session={null} />)

        expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: '開啟使用者選單' })).not.toBeInTheDocument()
    })
})

describe('NavBar 已登入', () => {
    it('顯示頭像選單，不再有獨立的登入鈕', () => {
        render(<NavBar session={user} />)

        expect(getTrigger()).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: '登入' })).not.toBeInTheDocument()
    })

    it('「前往前台」與「登出」都收在下拉選單裡，不散落在 header 上', async () => {
        render(<NavBar session={user} />)

        // 收合狀態下兩者都不該出現在畫面上
        expect(screen.queryByRole('menuitem', { name: '前往前台' })).not.toBeInTheDocument()
        expect(screen.queryByRole('menuitem', { name: '登出' })).not.toBeInTheDocument()

        await userEvent.click(getTrigger())

        expect(screen.getByRole('menuitem', { name: '前往前台' })).toHaveAttribute('href', '/')
        expect(screen.getByRole('menuitem', { name: '登出' })).toBeInTheDocument()
    })

    it('後台的選單指向前台，而不是指回後台自己', async () => {
        render(<NavBar session={user} />)

        await userEvent.click(getTrigger())

        expect(screen.queryByRole('menuitem', { name: '前往後台' })).not.toBeInTheDocument()
    })

    it('登出後導回首頁', async () => {
        render(<NavBar session={user} />)
        await userEvent.click(getTrigger())

        await userEvent.click(screen.getByRole('menuitem', { name: '登出' }))

        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' })
    })

    it('顯示使用者頭像', () => {
        render(<NavBar session={user} />)

        expect(screen.getByRole('img', { name: '使用者頭像' })).toHaveAttribute(
            'src',
            'https://example.com/avatar.png'
        )
    })
})

describe('NavBar 共通', () => {
    it.each([
        ['未登入', null],
        ['已登入', user],
    ] as const)('%s 都有品牌連結與主題切換', (_l, s) => {
        render(<NavBar session={s} />)

        expect(screen.getByRole('link', { name: 'NewsScore 首頁' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '切換深淺色主題' })).toBeInTheDocument()
    })
})
