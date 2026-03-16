'use server'

import { ObjectId } from 'mongodb'
import { requireAuth } from '@/libs/auth'
import { getCollection, UserDocument } from '@/libs/db'

export async function getProfileAction() {
    try {
        const auth = await requireAuth()
        if (!auth.authenticated) {
            return { success: false as const, error: auth.error }
        }

        const currentUser = auth.user
        const usersCollection = await getCollection<UserDocument>('users')

        const user = await usersCollection.findOne({
            _id: new ObjectId(currentUser.id) as unknown as UserDocument['_id'],
        })

        if (!user) {
            return { success: false as const, error: 'User not found' }
        }

        return {
            success: true as const,
            profile: {
                nickname: user.nickname ?? '',
                bio: user.bio ?? '',
                avatar: user.image ?? '',
                name: user.name ?? '',
                email: user.email ?? '',
            },
        }
    } catch (error) {
        console.error('Error in getProfileAction:', error)
        return { success: false as const, error: 'Internal server error' }
    }
}

export async function updateProfileAction(nickname: string, bio: string) {
    try {
        const auth = await requireAuth()
        if (!auth.authenticated) {
            return { success: false as const, error: auth.error }
        }

        const currentUser = auth.user

        if (nickname !== undefined && nickname.length > 20) {
            return { success: false as const, error: '暱稱不能超過 20 個字' }
        }

        if (bio !== undefined && bio.length > 200) {
            return { success: false as const, error: '自我介紹不能超過 200 個字' }
        }

        const usersCollection = await getCollection<UserDocument>('users')

        const updateFields: Record<string, string> = {}
        if (nickname !== undefined) updateFields.nickname = nickname.trim()
        if (bio !== undefined) updateFields.bio = bio.trim()

        await usersCollection.updateOne(
            { _id: new ObjectId(currentUser.id) as unknown as UserDocument['_id'] },
            { $set: updateFields }
        )

        return { success: true as const, message: '個人資料已更新', profile: updateFields }
    } catch (error) {
        console.error('Error in updateProfileAction:', error)
        return { success: false as const, error: 'Internal server error' }
    }
}
