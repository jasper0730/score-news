import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const getProfileAction = vi.hoisted(() => vi.fn())
const updateProfileAction = vi.hoisted(() => vi.fn())
vi.mock('@/actions/profileActions', () => ({ getProfileAction, updateProfileAction }))

const toastBox = vi.hoisted(() => vi.fn())
vi.mock('@/utils/toast', () => ({ toastBox }))

const ProfileForm = (await import('@/components/organisms/ProfileForm')).default

const PROFILE = {
    nickname: '阿明',
    bio: '哈囉',
    avatar: 'https://example.com/avatar.png',
    name: '小明',
    email: 'ming@example.com',
}

const getNickname = () => screen.getByLabelText('暱稱（顯示於評論區）')
const getBio = () => screen.getByLabelText('自我介紹')
const getSave = () => screen.getByRole('button', { name: /儲存/ })

beforeEach(() => {
    getProfileAction.mockResolvedValue({ success: true, profile: PROFILE })
    updateProfileAction.mockResolvedValue({ success: true })
})

describe('ProfileForm 載入', () => {
    it('載入中顯示 loader', () => {
        getProfileAction.mockReturnValue(new Promise(() => {}))
        render(<ProfileForm />)

        expect(screen.queryByLabelText('暱稱（顯示於評論區）')).not.toBeInTheDocument()
    })

    it('載入後把既有資料填進表單', async () => {
        render(<ProfileForm />)

        expect(await screen.findByLabelText('暱稱（顯示於評論區）')).toHaveValue('阿明')
        expect(getBio()).toHaveValue('哈囉')
    })

    it('顯示無法編輯的姓名與 Email', async () => {
        render(<ProfileForm />)

        expect(await screen.findByRole('heading', { name: '小明' })).toBeInTheDocument()
        expect(screen.getByText('ming@example.com')).toBeInTheDocument()
    })

    it('沒有設定姓名時顯示替代文字', async () => {
        getProfileAction.mockResolvedValue({ success: true, profile: { ...PROFILE, name: '' } })
        render(<ProfileForm />)

        expect(await screen.findByRole('heading', { name: '未設定姓名' })).toBeInTheDocument()
    })

    it('取得資料失敗時仍結束載入，不會卡在 loader', async () => {
        getProfileAction.mockRejectedValue(new Error('boom'))
        render(<ProfileForm />)

        expect(await screen.findByLabelText('暱稱（顯示於評論區）')).toBeInTheDocument()
    })
})

describe('ProfileForm 字數', () => {
    it('顯示暱稱與自我介紹的字數', async () => {
        render(<ProfileForm />)
        await screen.findByLabelText('暱稱（顯示於評論區）')

        expect(screen.getByText('2/20')).toBeInTheDocument()
        expect(screen.getByText('2/200')).toBeInTheDocument()
    })

    it('輸入時字數跟著更新', async () => {
        render(<ProfileForm />)
        await screen.findByLabelText('暱稱（顯示於評論區）')

        await userEvent.type(getNickname(), '哥')

        expect(screen.getByText('3/20')).toBeInTheDocument()
    })

    it('欄位以 maxLength 擋住超長輸入，與伺服器端的限制一致', async () => {
        render(<ProfileForm />)
        await screen.findByLabelText('暱稱（顯示於評論區）')

        expect(getNickname()).toHaveAttribute('maxLength', '20')
        expect(getBio()).toHaveAttribute('maxLength', '200')
    })
})

describe('ProfileForm 儲存', () => {
    it('把目前的暱稱與自我介紹送出', async () => {
        render(<ProfileForm />)
        await screen.findByLabelText('暱稱（顯示於評論區）')

        await userEvent.clear(getNickname())
        await userEvent.type(getNickname(), '新暱稱')
        await userEvent.click(getSave())

        await waitFor(() => expect(updateProfileAction).toHaveBeenCalledWith('新暱稱', '哈囉'))
        expect(toastBox).toHaveBeenCalledWith('個人資料已更新', 'success')
    })

    it('儲存中停用按鈕，避免重複送出', async () => {
        let resolveSave: (value: unknown) => void = () => {}
        updateProfileAction.mockReturnValue(new Promise((resolve) => (resolveSave = resolve)))
        render(<ProfileForm />)
        await screen.findByLabelText('暱稱（顯示於評論區）')

        await userEvent.click(getSave())

        expect(screen.getByRole('button', { name: '儲存中...' })).toBeDisabled()

        await userEvent.click(screen.getByRole('button', { name: '儲存中...' }))
        expect(updateProfileAction).toHaveBeenCalledOnce()

        resolveSave({ success: true })
        await waitFor(() => expect(getSave()).toBeEnabled())
    })

    it('伺服器回錯誤時顯示該訊息', async () => {
        updateProfileAction.mockResolvedValue({ success: false, error: '暱稱不能超過 20 個字' })
        render(<ProfileForm />)
        await screen.findByLabelText('暱稱（顯示於評論區）')

        await userEvent.click(getSave())

        await waitFor(() => expect(toastBox).toHaveBeenCalledWith('暱稱不能超過 20 個字', 'error'))
    })

    it('伺服器沒給訊息時退回預設錯誤字串', async () => {
        updateProfileAction.mockResolvedValue({ success: false })
        render(<ProfileForm />)
        await screen.findByLabelText('暱稱（顯示於評論區）')

        await userEvent.click(getSave())

        await waitFor(() => expect(toastBox).toHaveBeenCalledWith('更新失敗', 'error'))
    })

    it('丟出例外時提示稍後再試，並回到可再次儲存的狀態', async () => {
        updateProfileAction.mockRejectedValue(new Error('boom'))
        render(<ProfileForm />)
        await screen.findByLabelText('暱稱（顯示於評論區）')

        await userEvent.click(getSave())

        await waitFor(() => expect(toastBox).toHaveBeenCalledWith('更新失敗，請稍後再試', 'error'))
        expect(getSave()).toBeEnabled()
    })
})
