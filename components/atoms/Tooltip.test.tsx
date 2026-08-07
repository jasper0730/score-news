import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Tooltip from '@/components/atoms/Tooltip'

describe('Tooltip', () => {
    it('渲染包在裡面的內容', () => {
        render(
            <Tooltip label="按讚">
                <button>❤</button>
            </Tooltip>
        )

        expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('顯示提示文字', () => {
        render(
            <Tooltip label="加入收藏">
                <button aria-label="加入收藏">🔖</button>
            </Tooltip>
        )

        expect(screen.getByText('加入收藏')).toBeInTheDocument()
    })

    it('提示文字對無障礙樹隱藏——按鈕自己已經有 aria-label，否則會被讀兩次', () => {
        render(
            <Tooltip label="分享">
                <button aria-label="分享">↗</button>
            </Tooltip>
        )

        expect(screen.getByText('分享')).toHaveAttribute('aria-hidden', 'true')
        // 只找得到按鈕這一個「分享」，提示不會變成第二個可及元素
        expect(screen.getAllByLabelText('分享')).toHaveLength(1)
    })

    it('預設是隱形的，滑鼠移上去才顯示', () => {
        render(
            <Tooltip label="按讚">
                <button>❤</button>
            </Tooltip>
        )

        const tip = screen.getByText('按讚')
        expect(tip).toHaveClass('opacity-0')
        expect(tip.className).toContain('group-hover:opacity-100')
    })

    it('不吃滑鼠事件，不會擋住底下的元素', () => {
        render(
            <Tooltip label="按讚">
                <button>❤</button>
            </Tooltip>
        )

        expect(screen.getByText('按讚')).toHaveClass('pointer-events-none')
    })
})
