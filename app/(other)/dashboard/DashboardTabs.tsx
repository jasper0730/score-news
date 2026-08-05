'use client'

import { cn } from '@/libs/cn'
import type { DashboardTab } from '@/types/news'

interface DashboardTabsProps {
    activeTab: DashboardTab
    onTabChange: (tab: DashboardTab) => void
}

const TABS: { key: DashboardTab; label: string }[] = [
    { key: 'favorites', label: '📌 我的收藏' },
    { key: 'comments', label: '💬 我的評論' },
    { key: 'profile', label: '👤 個人資料' },
]

const DashboardTabs = ({ activeTab, onTabChange }: DashboardTabsProps) => {
    return (
        <div className="sticky top-nav z-[5] flex border-b bg-background">
            {TABS.map((tab) => (
                <button
                    key={tab.key}
                    className={cn(
                        'flex-1 cursor-pointer border-b-2 border-transparent py-3 text-center text-muted-foreground transition duration-300 hover:text-foreground',
                        activeTab === tab.key && 'border-foreground font-semibold text-foreground'
                    )}
                    aria-current={activeTab === tab.key ? 'page' : undefined}
                    onClick={() => onTabChange(tab.key)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}

export default DashboardTabs
