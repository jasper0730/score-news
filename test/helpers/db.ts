import { vi, type Mock } from 'vitest'

/**
 * MongoDB collection 的測試替身。
 *
 * 這裡刻意不模擬 MongoDB 的查詢語意（不會真的去執行 $match / $sort），
 * 而是把「送出去的查詢」記錄下來、把「回傳的資料」交給測試指定。
 * 要驗證的是我們自己的程式碼有沒有組出正確的 filter、pipeline、skip/limit，
 * 以及拿到結果後有沒有正確合併與轉型；MongoDB 本身的行為不是我們的責任。
 */
export interface FakeCursor {
    sort: Mock
    skip: Mock
    limit: Mock
    toArray: Mock
}

export interface FakeCollection {
    find: Mock
    aggregate: Mock
    findOne: Mock
    countDocuments: Mock
    insertOne: Mock
    insertMany: Mock
    updateOne: Mock
    deleteOne: Mock
    deleteMany: Mock
    bulkWrite: Mock
    findOneAndUpdate: Mock
    /** find() 回傳的 cursor，用來設定 toArray 的結果或斷言 sort/skip/limit */
    cursor: FakeCursor
    /** aggregate() 回傳的 cursor */
    aggregateCursor: { toArray: Mock }
}

function createFakeCursor(): FakeCursor {
    const cursor = {} as FakeCursor
    cursor.sort = vi.fn(() => cursor)
    cursor.skip = vi.fn(() => cursor)
    cursor.limit = vi.fn(() => cursor)
    cursor.toArray = vi.fn(async () => [])
    return cursor
}

function createFakeCollection(): FakeCollection {
    const cursor = createFakeCursor()
    const aggregateCursor = { toArray: vi.fn(async () => []) }

    return {
        cursor,
        aggregateCursor,
        find: vi.fn(() => cursor),
        aggregate: vi.fn(() => aggregateCursor),
        findOne: vi.fn(async () => null),
        countDocuments: vi.fn(async () => 0),
        insertOne: vi.fn(async () => ({ acknowledged: true, insertedId: 'inserted-id' })),
        insertMany: vi.fn(async () => ({ acknowledged: true, insertedCount: 0 })),
        updateOne: vi.fn(async () => ({ acknowledged: true, modifiedCount: 1 })),
        deleteOne: vi.fn(async () => ({ acknowledged: true, deletedCount: 1 })),
        deleteMany: vi.fn(async () => ({ acknowledged: true, deletedCount: 0 })),
        bulkWrite: vi.fn(async () => ({
            acknowledged: true,
            upsertedCount: 0,
            modifiedCount: 0,
            matchedCount: 0,
        })),
        findOneAndUpdate: vi.fn(async () => null),
    }
}

const registry = new Map<string, FakeCollection>()

/** 取得（或建立）某個 collection 的替身，同名一律拿到同一個實例 */
export function collection(name: string): FakeCollection {
    let existing = registry.get(name)
    if (!existing) {
        existing = createFakeCollection()
        registry.set(name, existing)
    }
    return existing
}

export function resetCollections() {
    registry.clear()
}

export const getCollection = vi.fn(async (name: string) => collection(name))

/**
 * 各測試檔要在頂層自行寫上（vi.mock 只有寫在模組頂層才會被 hoist 到 import 之前）：
 *
 *     vi.mock('@/libs/db', async () => ({
 *         getCollection: (await import('@/test/helpers/db')).getCollection,
 *     }))
 */
