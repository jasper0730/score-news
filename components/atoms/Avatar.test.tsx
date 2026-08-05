import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Avatar from '@/components/atoms/Avatar'

describe('Avatar', () => {
    it('顯示傳入的頭像', () => {
        render(<Avatar src="https://example.com/me.png" />)

        expect(screen.getByRole('img', { name: '使用者頭像' })).toHaveAttribute(
            'src',
            'https://example.com/me.png'
        )
    })

    it.each([[undefined], [null], ['']])('沒有頭像（%s）時退回預設圖', (src) => {
        render(<Avatar src={src} />)

        expect(screen.getByRole('img')).toHaveAttribute('src', '/images/placeholder.jpg')
    })

    it.each([
        ['sm', 'h-6 w-6', '24px'],
        ['md', 'h-9 w-9', '36px'],
        ['lg', 'h-12 w-12', '48px'],
    ] as const)('size=%s 對應尺寸樣式與 sizes 提示', (size, expectedClass, expectedSizes) => {
        const { container } = render(<Avatar size={size} />)

        expect(container.firstElementChild).toHaveClass(...expectedClass.split(' '))
        // sizes 對不上實際尺寸的話，next/image 會去抓最大的斷點
        expect(screen.getByRole('img')).toHaveAttribute('sizes', expectedSizes)
    })

    it('預設為 md', () => {
        const { container } = render(<Avatar />)

        expect(container.firstElementChild).toHaveClass('h-9', 'w-9')
    })

    it('外部 className 可以覆蓋內建尺寸', () => {
        const { container } = render(<Avatar size="sm" className="h-20 w-20" />)

        expect(container.firstElementChild).toHaveClass('h-20', 'w-20')
        expect(container.firstElementChild).not.toHaveClass('h-6')
    })
})
