'use client'

import { FaRegBookmark, FaRegComment, FaRegUser } from 'react-icons/fa6'
import { cn } from '@/libs/cn'
import { HEADER_FADE_CLASSES } from '@/libs/styles'
import type { DashboardTab } from '@/types/news'

interface DashboardTabsProps {
    activeTab: DashboardTab
    onTabChange: (tab: DashboardTab) => void
}

/**
 * 用 react-icons 而非 emoji。
 *
 * emoji 是彩色點陣字，顏色固定、各平台長相不一，而且不會跟著未選取／選取的
 * 文字色變化。這裡的圖示吃 currentColor，深淺色主題與 active 狀態都自動跟上。
 *
 * 收藏用書籤圖示，與新聞卡片上的收藏鈕一致。
 */
const TABS: { key: DashboardTab; label: string; Icon: typeof FaRegBookmark }[] = [
    { key: 'favorites', label: '我的收藏', Icon: FaRegBookmark },
    { key: 'comments', label: '我的評論', Icon: FaRegComment },
    { key: 'profile', label: '個人資料', Icon: FaRegUser },
]

/**
 * 分頁列緊貼在 NavBar 下緣，兩者合起來才是使用者眼中的「後台 header」，
 * 所以下緣的漸層收邊掛在這裡。NavBar 自己也有一個，但會被這排整片蓋掉，
 * 那個是留給日後 (other) 群組裡沒有分頁列的頁面用的。
 */
const DashboardTabs = ({ activeTab, onTabChange }: DashboardTabsProps) => {
    return (
        <div className="sticky top-nav z-[5] flex bg-background">
            {TABS.map(({ key, label, Icon }) => (
                <button
                    key={key}
                    className={cn(
                        'flex flex-1 cursor-pointer items-center justify-center gap-2 border-b-2 border-transparent py-3 text-muted-foreground transition duration-300 hover:text-foreground',
                        activeTab === key && 'border-foreground font-semibold text-foreground'
                    )}
                    aria-current={activeTab === key ? 'page' : undefined}
                    onClick={() => onTabChange(key)}
                >
                    {/* 圖示純裝飾，旁邊已經有文字標籤，不必再讓螢幕閱讀器讀一次 */}
                    <Icon aria-hidden className="shrink-0" />
                    {label}
                </button>
            ))}
            <div className={HEADER_FADE_CLASSES} aria-hidden />
        </div>
    )
}

export default DashboardTabs
