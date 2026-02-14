'use client'

import { useState } from 'react'
import type { DashboardTab } from '@/types/news'

interface DashboardTabsProps {
    activeTab: DashboardTab
    onTabChange: (tab: DashboardTab) => void
}

const DashboardTabs = ({ activeTab, onTabChange }: DashboardTabsProps) => {
    const tabs: { key: DashboardTab; label: string }[] = [
        { key: 'favorites', label: '📌 我的收藏' },
        { key: 'comments', label: '💬 我的評論' },
        { key: 'profile', label: '👤 個人資料' },
    ]

    return (
        <div className="flex border-b sticky top-[--navH] bg-white dark:bg-black z-[5]">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    className={`flex-1 py-3 text-center cursor-pointer text-gray-500 border-b-2 border-transparent transition duration-300 hover:text-gray-800 dark:hover:text-gray-200 ${
                        activeTab === tab.key ? 'text-black dark:text-white border-black dark:border-white font-semibold' : ''
                    }`}
                    onClick={() => onTabChange(tab.key)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}

export default DashboardTabs
