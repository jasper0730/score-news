'use client'

import { useCallback, useEffect, useState } from 'react'
import { toastBox } from '@/utils/toast'
import axios from 'axios'
import Avatar from '@/components/atoms/Avatar'
import Button from '@/components/atoms/Button'
import Loader from '@/components/atoms/Loader'
import type { ProfileType } from '@/types/news'

interface ProfileApiResponse {
    success: boolean
    profile: ProfileType & { name: string; email: string }
    message?: string
}

const ProfileForm = () => {
    const [profile, setProfile] = useState<ProfileApiResponse['profile'] | null>(null)
    const [nickname, setNickname] = useState('')
    const [bio, setBio] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const fetchProfile = useCallback(async () => {
        try {
            const res = await axios.get<ProfileApiResponse>('/api/profile')
            if (res.data.success) {
                setProfile(res.data.profile)
                setNickname(res.data.profile.nickname)
                setBio(res.data.profile.bio)
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    const handleSubmit = async () => {
        if (isSaving) return

        setIsSaving(true)
        try {
            const res = await axios.put<ProfileApiResponse>('/api/profile', {
                nickname,
                bio,
            })

            if (res.data.success) {
                toastBox('個人資料已更新', 'success')
            }
        } catch (error) {
            console.error('Failed to update profile:', error)
            toastBox('更新失敗，請稍後再試', 'error')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) return <Loader />

    return (
        <div className="max-w-lg mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b dark:border-gray-700">
                <Avatar src={profile?.avatar} size="lg" />
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold">{profile?.name || '未設定姓名'}</h3>
                    <p className="text-sm text-gray-400">{profile?.email}</p>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300" htmlFor="nickname">
                        暱稱（顯示於評論區）
                    </label>
                    <input
                        id="nickname"
                        type="text"
                        className="w-full p-3 border-2 rounded-lg focus:outline-none focus:border-blue-400 bg-transparent transition duration-300"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="設定你的暱稱..."
                        maxLength={20}
                    />
                    <span className="text-xs text-gray-400 text-right">{nickname.length}/20</span>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300" htmlFor="bio">
                        自我介紹
                    </label>
                    <textarea
                        id="bio"
                        className="w-full p-3 border-2 rounded-lg resize-none focus:outline-none focus:border-blue-400 bg-transparent transition duration-300"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="介紹一下你自己..."
                        rows={4}
                        maxLength={200}
                    />
                    <span className="text-xs text-gray-400 text-right">{bio.length}/200</span>
                </div>
            </div>

            <Button
                className={`mt-6 w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:opacity-90 duration-300 cursor-pointer ${isSaving ? 'opacity-60 pointer-events-none' : ''}`}
                onClick={handleSubmit}
                disabled={isSaving}
            >
                {isSaving ? '儲存中...' : '儲存變更'}
            </Button>
        </div>
    )
}

export default ProfileForm
