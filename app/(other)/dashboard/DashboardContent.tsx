'use client'

import { useState } from 'react'
import type { DashboardTab } from '@/types/news'
import DashboardTabs from './DashboardTabs'
import DashboardNewsList from './DashboardNewsList'
import DashboardCommentList from './DashboardCommentList'
import ProfileForm from '@/components/organisms/ProfileForm'

interface DashboardContentProps {
    user: { id: string }
}

const DashboardContent = ({ user }: DashboardContentProps) => {
    const [activeTab, setActiveTab] = useState<DashboardTab>('favorites')

    // 高度要扣掉 NavBar：外層 section 已經用 pt-nav 讓位了，這裡再要一個滿版
    // 高度，加起來就比視窗高一個 NavBar，內容再少都會多出一段捲動。
    // 單位跟 root layout 的 min-h-dvh 一致，用 vh 的話手機瀏覽器工具列
    // 收合時又會對不上。
    return (
        <div className="min-h-[calc(100dvh-var(--nav-height))]">
            <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="px-4">
                {activeTab === 'favorites' && <DashboardNewsList user={user} />}
                {activeTab === 'comments' && <DashboardCommentList userId={user.id} />}
                {activeTab === 'profile' && <ProfileForm />}
            </div>
        </div>
    )
}

export default DashboardContent
