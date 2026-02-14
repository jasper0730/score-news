'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { DashboardTab } from '@/types/news'
import DashboardTabs from './DashboardTabs'
import DashboardNewsList from './DashboardNewsList'
import DashboardCommentList from './DashboardCommentList'
import ProfileForm from '@/components/organisms/ProfileForm'

interface DashboardContentProps {
    user: { id: string } | null
}

const DashboardContent = ({ user }: DashboardContentProps) => {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<DashboardTab>('favorites')

    useEffect(() => {
        if (!user) {
            router.push('/login')
        }
    }, [user, router])

    if (!user) return null

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
