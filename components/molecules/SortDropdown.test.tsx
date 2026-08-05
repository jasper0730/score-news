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
            'date_asc',
            'rating_desc',
            'rating_asc',
            'views',
        ])
    })

    it('顯示 store 目前的排序方式', () => {
        useNewsStore.setState({ sortType: 'views' })
        render(<SortDropdown />)

        expect(getSelect()).toHaveValue('views')
    })

    it('選擇後更新 store', async () => {
        render(<SortDropdown />)

        await userEvent.selectOptions(getSelect(), 'rating_desc')

        expect(useNewsStore.getState().sortType).toBe('rating_desc')
    })

    it('store 從外部改變時跟著同步', () => {
        const { rerender } = render(<SortDropdown />)
        expect(getSelect()).toHaveValue('date_desc')

        useNewsStore.setState({ sortType: 'date_asc' })
        rerender(<SortDropdown />)

        expect(getSelect()).toHaveValue('date_asc')
    })
})
