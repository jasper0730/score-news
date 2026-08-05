import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import StarDisplay from '@/components/molecules/StarDisplay'

describe('StarDisplay', () => {
    it.each([0, -1, Number.NaN])('分數為 %s 時不渲染任何東西', (rating) => {
        const { container } = render(<StarDisplay rating={rating} />)

        expect(container).toBeEmptyDOMElement()
    })

    it('依分數渲染對應數量的星星', () => {
        const { container } = render(<StarDisplay rating={4} />)

        expect(container.querySelectorAll('svg')).toHaveLength(4)
    })

    it.each([
        [3.4, 3],
        [3.5, 4],
        [3.6, 4],
    ])('平均分數 %s 四捨五入為 %i 顆星', (rating, expected) => {
        const { container } = render(<StarDisplay rating={rating} />)

        expect(container.querySelectorAll('svg')).toHaveLength(expected)
    })

    it('提供文字替代說明給螢幕閱讀器', () => {
        render(<StarDisplay rating={3.6} />)

        expect(screen.getByRole('img')).toHaveAccessibleName('評分 4 顆星')
    })
})
