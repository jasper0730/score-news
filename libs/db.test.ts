import { describe, expect, it, vi } from 'vitest'

const collection = vi.hoisted(() => vi.fn((name: string) => ({ name })))
const db = vi.hoisted(() => vi.fn(() => ({ collection })))
vi.mock('@/libs/mongodb', () => ({
    default: () => Promise.resolve({ db }),
    getMongoClient: () => Promise.resolve({ db }),
}))

const { getDb, getCollection } = await import('@/libs/db')

describe('getDb', () => {
    it('用連線字串內指定的資料庫，不在程式裡寫死名稱', async () => {
        await getDb()

        expect(db).toHaveBeenCalledWith()
    })
})

describe('getCollection', () => {
    it('依名稱取得 collection', async () => {
        const result = await getCollection('news')

        expect(collection).toHaveBeenCalledWith('news')
        expect(result).toEqual({ name: 'news' })
    })
})
