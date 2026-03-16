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

    return (
        <div className="min-h-screen">
            <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="px-4">
                {activeTab === 'favorites' && (
                    <DashboardNewsList user={user} />
                )}
                {activeTab === 'comments' && (
                    <DashboardCommentList userId={user.id} />
                )}
                {activeTab === 'profile' && (
                    <ProfileForm />
                )}
            </div>
        </div>
    )
}

export default DashboardContent
