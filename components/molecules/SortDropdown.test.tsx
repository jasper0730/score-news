import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SortDropdown from '@/components/molecules/SortDropdown'
import { useNewsStore } from '@/store/newsStore'

describe('SortDropdown', () => {
    const initialState = useNewsStore.getState()
    beforeEach(() => {
        useNewsStore.setState(initialState, true)
    })

    const getSelect = () => screen.getByRole('combobox', { name: '排序方式' })

    it('提供全部五種排序方式', () => {
        render(<SortDropdown />)

        expect(screen.getAllByRole('option').map((o) => o.getAttribute('value'))).toEqual([
            'date_desc',
            'trending',
            'views',
            'favorites',
            'likes',
        ])
    })

    it('選項文字', () => {
        render(<SortDropdown />)

        expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
            '最新文章',
            '即時發燒',
            '最多瀏覽',
            '最多收藏',
            '最多讚',
        ])
    })

    it('顯示 store 目前的排序方式', () => {
        useNewsStore.setState({ sortType: 'likes' })
        render(<SortDropdown />)

        expect(getSelect()).toHaveValue('likes')
    })

    it('選擇後更新 store', async () => {
        render(<SortDropdown />)

        await userEvent.selectOptions(getSelect(), 'trending')

        expect(useNewsStore.getState().sortType).toBe('trending')
    })

    it('store 從外部改變時跟著同步', () => {
        const { rerender } = render(<SortDropdown />)
        expect(getSelect()).toHaveValue('date_desc')

        useNewsStore.setState({ sortType: 'views' })
        rerender(<SortDropdown />)

        expect(getSelect()).toHaveValue('views')
    })
})
