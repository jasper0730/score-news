import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import BrandLink from '@/components/molecules/BrandLink'

describe('BrandLink', () => {
    it('連到首頁並提供無障礙名稱', () => {
        render(<BrandLink />)

        expect(screen.getByRole('link', { name: 'NewsScore 首頁' })).toHaveAttribute('href', '/')
    })

    it('預設在任何尺寸都顯示品牌字樣', () => {
        render(<BrandLink />)

        expect(screen.getByText('NewsScore')).not.toHaveClass('hidden')
    })

    it('hideTextOnMobile 時窄螢幕隱藏字樣', () => {
        render(<BrandLink hideTextOnMobile />)

        expect(screen.getByText('NewsScore')).toHaveClass('hidden', 'sm:inline')
    })

    it('可以附加外部 className', () => {
        render(<BrandLink className="mr-4" />)

        expect(screen.getByRole('link')).toHaveClass('mr-4')
    })
})
