import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StarRating from '@/components/molecules/StarRating'

/** 星星是 svg，沒有 role，只能用 class 判斷亮起來的數量 */
function litStarCount(container: HTMLElement) {
    return container.querySelectorAll('.text-star').length
}

describe('StarRating', () => {
    it('預設渲染 5 顆星', () => {
        const { container } = render(<StarRating value={0} onChange={vi.fn()} />)

        expect(container.querySelectorAll('svg')).toHaveLength(5)
    })

    it('可以自訂星星數量', () => {
        const { container } = render(<StarRating value={0} onChange={vi.fn()} maxStars={10} />)

        expect(container.querySelectorAll('svg')).toHaveLength(10)
    })

    it('依 value 點亮對應數量的星星', () => {
        const { container } = render(<StarRating value={3} onChange={vi.fn()} />)

        expect(litStarCount(container)).toBe(3)
    })

    it('value 為 0 時沒有星星是亮的', () => {
        const { container } = render(<StarRating value={0} onChange={vi.fn()} />)

        expect(litStarCount(container)).toBe(0)
    })

    it('點擊第 n 顆星回報 n 分', async () => {
        const onChange = vi.fn()
        const { container } = render(<StarRating value={0} onChange={onChange} />)

        await userEvent.click(container.querySelectorAll('svg')[3]!)

        expect(onChange).toHaveBeenCalledWith(4)
    })

    it('再次點擊目前的分數會取消評分（歸零）', async () => {
        const onChange = vi.fn()
        const { container } = render(<StarRating value={3} onChange={onChange} />)

        await userEvent.click(container.querySelectorAll('svg')[2]!)

        expect(onChange).toHaveBeenCalledWith(0)
    })

    it('滑鼠移過去時預覽該分數', async () => {
        const { container } = render(<StarRating value={1} onChange={vi.fn()} />)

        await userEvent.hover(container.querySelectorAll('svg')[4]!)

        expect(litStarCount(container)).toBe(5)
    })

    it('滑鼠移開後回到實際分數', async () => {
        const { container } = render(<StarRating value={1} onChange={vi.fn()} />)
        const stars = container.querySelectorAll('svg')

        await userEvent.hover(stars[4]!)
        await userEvent.unhover(stars[4]!)

        expect(litStarCount(container)).toBe(1)
    })
})
