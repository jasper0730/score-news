'use client'

import { type ReactNode } from 'react'
import { cn } from '@/libs/cn'

interface TooltipProps {
    /** 提示文字。與觸發元素自身的 aria-label 相同即可，不要重複給無障礙名稱 */
    label: string
    children: ReactNode
    className?: string
}

/**
 * 滑鼠移上去顯示的文字提示。
 *
 * 純 CSS（group-hover / group-focus-within），不用 JS 也不用狀態——
 * 圖示按鈕的提示不值得為它引入一顆 state 與事件監聽。
 *
 * 刻意用 aria-hidden：包在裡面的按鈕本來就有 aria-label，
 * 再讓提示文字進到無障礙樹會被讀兩次。
 * 也因此 focus-within 只是視覺上的方便，不是無障礙的必要條件。
 */
const Tooltip = ({ label, children, className }: TooltipProps) => {
    return (
        <div className={cn('group relative flex', className)}>
            {children}
            <span
                aria-hidden
                className={
                    // 用 opacity 而非 hidden：可以有淡入，而且不會在出現時改變版面
                    'pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 ' +
                    'whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background ' +
                    'opacity-0 shadow-lg transition-opacity duration-150 ' +
                    'group-focus-within:opacity-100 group-hover:opacity-100'
                }
            >
                {label}
            </span>
        </div>
    )
}

export default Tooltip
