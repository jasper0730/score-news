'use client'

import { useCallback, useEffect, useState } from 'react'
import { toastBox } from '@/utils/toast'
import { getProfileAction, updateProfileAction } from '@/actions/profileActions'
import Avatar from '@/components/atoms/Avatar'
import Button from '@/components/atoms/Button'
import Input from '@/components/atoms/Input'
import Textarea from '@/components/atoms/Textarea'
import Loader from '@/components/atoms/Loader'

const MAX_NICKNAME_LENGTH = 20
const MAX_BIO_LENGTH = 200

interface Profile {
    nickname: string
    bio: string
    avatar: string
    name: string
    email: string
}

const ProfileForm = () => {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [nickname, setNickname] = useState('')
    const [bio, setBio] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const fetchProfile = useCallback(async () => {
        try {
            const result = await getProfileAction()
            if (result.success) {
                setProfile(result.profile)
                setNickname(result.profile.nickname)
                setBio(result.profile.bio)
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
            const result = await updateProfileAction(nickname, bio)

            if (result.success) {
                toastBox('個人資料已更新', 'success')
            } else {
                toastBox(result.error ?? '更新失敗', 'error')
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
        <div className="mx-auto max-w-lg px-4 py-8">
            <div className="mb-8 flex items-center gap-4 border-b pb-6">
                <Avatar src={profile?.avatar} size="lg" />
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold">{profile?.name || '未設定姓名'}</h3>
                    <p className="text-sm text-subtle">{profile?.email}</p>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-muted-foreground" htmlFor="nickname">
                        暱稱（顯示於評論區）
                    </label>
                    <Input
                        id="nickname"
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="設定你的暱稱..."
                        maxLength={MAX_NICKNAME_LENGTH}
                    />
                    <span className="text-right text-xs text-subtle">
                        {nickname.length}/{MAX_NICKNAME_LENGTH}
                    </span>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-muted-foreground" htmlFor="bio">
                        自我介紹
                    </label>
                    <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="介紹一下你自己..."
                        rows={4}
                        maxLength={MAX_BIO_LENGTH}
                    />
                    <span className="text-right text-xs text-subtle">
                        {bio.length}/{MAX_BIO_LENGTH}
                    </span>
                </div>
            </div>

            <Button
                variant="brand"
                size="lg"
                fullWidth
                className="mt-6"
                onClick={handleSubmit}
                disabled={isSaving}
            >
                {isSaving ? '儲存中...' : '儲存變更'}
            </Button>
        </div>
    )
}

export default ProfileForm
