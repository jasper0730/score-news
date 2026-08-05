import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchBar from '@/components/molecules/SearchBar'
import { useNewsStore } from '@/store/newsStore'

describe('SearchBar', () => {
    const initialState = useNewsStore.getState()
    beforeEach(() => {
        useNewsStore.setState(initialState, true)
    })

    const getInput = () => screen.getByRole('textbox', { name: '搜尋新聞' })

    it('輸入時只更新本地狀態，不立即打搜尋', async () => {
        render(<SearchBar />)

        await userEvent.type(getInput(), '颱風')

        // 每打一個字就送出去查會讓伺服器被連續請求灌爆
        expect(getInput()).toHaveValue('颱風')
        expect(useNewsStore.getState().query).toBe('')
    })

    it('按下搜尋鈕才把關鍵字送進 store', async () => {
        render(<SearchBar />)

        await userEvent.type(getInput(), '颱風')
        await userEvent.click(screen.getByRole('button', { name: '搜尋' }))

        expect(useNewsStore.getState().query).toBe('颱風')
    })

    it('按 Enter 等同按下搜尋鈕', async () => {
        render(<SearchBar />)

        await userEvent.type(getInput(), '地震{Enter}')

        expect(useNewsStore.getState().query).toBe('地震')
    })

    it('其他按鍵不會觸發搜尋', async () => {
        render(<SearchBar />)

        await userEvent.type(getInput(), '地震{Escape}')

        expect(useNewsStore.getState().query).toBe('')
    })

    it('沒有輸入內容時不顯示清除鈕', () => {
        render(<SearchBar />)

        expect(screen.queryByRole('button', { name: '清除搜尋' })).not.toBeInTheDocument()
    })

    it('有輸入內容時顯示清除鈕', async () => {
        render(<SearchBar />)

        await userEvent.type(getInput(), '颱風')

        expect(screen.getByRole('button', { name: '清除搜尋' })).toBeInTheDocument()
    })

    it('清除鈕同時清空輸入框與 store 裡的關鍵字', async () => {
        render(<SearchBar />)

        await userEvent.type(getInput(), '颱風{Enter}')
        await userEvent.click(screen.getByRole('button', { name: '清除搜尋' }))

        expect(getInput()).toHaveValue('')
        expect(useNewsStore.getState().query).toBe('')
    })

    it('搜尋鈕與輸入框都有無障礙名稱', () => {
        render(<SearchBar />)

        expect(screen.getByRole('button', { name: '搜尋' })).toBeInTheDocument()
        expect(getInput()).toBeInTheDocument()
    })
})
