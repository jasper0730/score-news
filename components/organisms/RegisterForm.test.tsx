import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const signIn = vi.hoisted(() => vi.fn())
vi.mock('next-auth/react', () => ({ signIn }))

const routerPush = vi.hoisted(() => vi.fn())
const routerReplace = vi.hoisted(() => vi.fn())
const routerRefresh = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: routerPush, replace: routerReplace, refresh: routerRefresh }),
}))

const toastBox = vi.hoisted(() => vi.fn())
vi.mock('@/utils/toast', () => ({ toastBox }))

const RegisterForm = (await import('@/components/organisms/RegisterForm')).default

const getEmail = () => screen.getByPlaceholderText('Email')
const getPassword = () => screen.getByPlaceholderText('Password')

async function fillForm(email: string, password: string) {
    await userEvent.clear(getEmail())
    await userEvent.clear(getPassword())
    if (email) await userEvent.type(getEmail(), email)
    if (password) await userEvent.type(getPassword(), password)
}

beforeEach(() => {
    signIn.mockResolvedValue({ ok: true, error: null })
    vi.stubGlobal('fetch', vi.fn())
})

describe('RegisterForm 表單驗證', () => {
    it('Email 格式錯誤時顯示錯誤且不送出', async () => {
        render(<RegisterForm type="login" />)

        await fillForm('not-an-email', 'abcd1234')
        await userEvent.click(screen.getByRole('button', { name: '登入' }))

        expect(await screen.findByText('請輸入正確的 Email')).toBeInTheDocument()
        expect(signIn).not.toHaveBeenCalled()
    })

    it('密碼少於 8 字元時顯示錯誤且不送出', async () => {
        render(<RegisterForm type="login" />)

        await fillForm('ming@example.com', 'short')
        await userEvent.click(screen.getByRole('button', { name: '登入' }))

        expect(await screen.findByText('密碼長度不可小於 8 個字元')).toBeInTheDocument()
        expect(signIn).not.toHaveBeenCalled()
    })

    it('修正後重新送出會清掉先前的錯誤訊息', async () => {
        render(<RegisterForm type="login" />)

        await fillForm('bad', 'short')
        await userEvent.click(screen.getByRole('button', { name: '登入' }))
        expect(await screen.findByText('請輸入正確的 Email')).toBeInTheDocument()

        await fillForm('ming@example.com', 'abcd1234')
        await userEvent.click(screen.getByRole('button', { name: '登入' }))

        await waitFor(() =>
            expect(screen.queryByText('請輸入正確的 Email')).not.toBeInTheDocument()
        )
    })
})

describe('RegisterForm 登入', () => {
    it('用 credentials 登入且不讓 next-auth 自行導向', async () => {
        render(<RegisterForm type="login" />)

        await fillForm('ming@example.com', 'abcd1234')
        await userEvent.click(screen.getByRole('button', { name: '登入' }))

        await waitFor(() =>
            expect(signIn).toHaveBeenCalledWith('credentials', {
                email: 'ming@example.com',
                password: 'abcd1234',
                redirect: false,
            })
        )
    })

    it('登入成功後在獨立頁面導回首頁', async () => {
        render(<RegisterForm type="login" />)

        await fillForm('ming@example.com', 'abcd1234')
        await userEvent.click(screen.getByRole('button', { name: '登入' }))

        await waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/'))
        expect(toastBox).toHaveBeenCalledWith('登入成功', 'success')
    })

    it('彈窗登入成功後留在原頁面，只重新取一次伺服器資料', async () => {
        const setOpenModal = vi.fn()
        render(<RegisterForm type="login" setOpenModal={setOpenModal} />)

        await fillForm('ming@example.com', 'abcd1234')
        await userEvent.click(screen.getByRole('button', { name: '登入' }))

        await waitFor(() => expect(routerRefresh).toHaveBeenCalled())
        expect(routerReplace).not.toHaveBeenCalled()
        expect(setOpenModal).toHaveBeenCalledWith(null)
    })

    it('登入失敗時顯示錯誤且不導頁', async () => {
        signIn.mockResolvedValue({ error: '帳號或密碼錯誤' })
        render(<RegisterForm type="login" />)

        await fillForm('ming@example.com', 'abcd1234')
        await userEvent.click(screen.getByRole('button', { name: '登入' }))

        await waitFor(() => expect(toastBox).toHaveBeenCalledWith('帳號或密碼錯誤', 'error'))
        expect(routerReplace).not.toHaveBeenCalled()
    })

    it('送出期間停用按鈕，避免重複送出', async () => {
        let resolveSignIn: (value: unknown) => void = () => {}
        signIn.mockReturnValue(new Promise((resolve) => (resolveSignIn = resolve)))
        render(<RegisterForm type="login" />)

        await fillForm('ming@example.com', 'abcd1234')
        await userEvent.click(screen.getByRole('button', { name: '登入' }))

        await waitFor(() => expect(screen.getByRole('button', { name: '登入' })).toBeDisabled())

        resolveSignIn({ ok: true })
        await waitFor(() => expect(screen.getByRole('button', { name: '登入' })).toBeEnabled())
    })
})

describe('RegisterForm 註冊', () => {
    it('呼叫註冊 API', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
        vi.stubGlobal('fetch', fetchMock)
        render(<RegisterForm type="signup" />)

        await fillForm('new@example.com', 'abcd1234')
        await userEvent.click(screen.getByRole('button', { name: '註冊' }))

        await waitFor(() =>
            expect(fetchMock).toHaveBeenCalledWith('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'new@example.com', password: 'abcd1234' }),
            })
        )
    })

    it('註冊成功後切換到登入表單', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))
        const setOpenModal = vi.fn()
        render(<RegisterForm type="signup" setOpenModal={setOpenModal} />)

        await fillForm('new@example.com', 'abcd1234')
        await userEvent.click(screen.getByRole('button', { name: '註冊' }))

        await waitFor(() => expect(setOpenModal).toHaveBeenCalledWith('login'))
        expect(toastBox).toHaveBeenCalledWith('註冊完成，請重新登入', 'success')
    })

    it('註冊失敗時顯示錯誤，不切換表單', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: false,
                json: async () => ({ error: 'Invalid email or password' }),
            })
        )
        const setOpenModal = vi.fn()
        render(<RegisterForm type="signup" setOpenModal={setOpenModal} />)

        await fillForm('new@example.com', 'abcd1234')
        await userEvent.click(screen.getByRole('button', { name: '註冊' }))

        await waitFor(() =>
            expect(toastBox).toHaveBeenCalledWith('發生未知錯誤，請稍後再試', 'error')
        )
        expect(setOpenModal).not.toHaveBeenCalled()
    })
})

describe('RegisterForm 社群登入', () => {
    it.each([
        ['FaceBook', 'facebook'],
        ['Google', 'google'],
        ['Github', 'github'],
    ])('%s 按鈕使用 %s provider', async (label, providerId) => {
        render(<RegisterForm type="login" />)

        await userEvent.click(screen.getByRole('button', { name: label }))

        await waitFor(() =>
            expect(signIn).toHaveBeenCalledWith(providerId, {
                redirect: false,
                callbackUrl: '/',
            })
        )
    })

    it('從彈窗社群登入時回到當下這頁', async () => {
        window.history.pushState({}, '', '/dashboard')
        render(<RegisterForm type="login" setOpenModal={vi.fn()} />)

        await userEvent.click(screen.getByRole('button', { name: 'Google' }))

        await waitFor(() =>
            expect(signIn).toHaveBeenCalledWith('google', {
                redirect: false,
                callbackUrl: '/dashboard',
            })
        )
    })

    it('註冊表單不顯示社群登入按鈕', () => {
        render(<RegisterForm type="signup" />)

        expect(screen.queryByRole('button', { name: 'Google' })).not.toBeInTheDocument()
    })
})

describe('RegisterForm 切換登入 / 註冊', () => {
    it('獨立頁面用路由切換', async () => {
        render(<RegisterForm type="login" />)

        await userEvent.click(screen.getByRole('button', { name: '註冊' }))

        expect(routerPush).toHaveBeenCalledWith('/signup')
    })

    it('彈窗則直接換表單，不改網址', async () => {
        const setOpenModal = vi.fn()
        render(<RegisterForm type="login" setOpenModal={setOpenModal} />)

        await userEvent.click(screen.getByRole('button', { name: '註冊' }))

        expect(setOpenModal).toHaveBeenCalledWith('signup')
        expect(routerPush).not.toHaveBeenCalled()
    })
})
