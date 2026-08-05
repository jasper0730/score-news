import { beforeEach, describe, expect, it, vi } from 'vitest'
import { collection } from '@/test/helpers/db'

vi.mock('@/libs/mongodb', async () => {
    const { collection } = await import('@/test/helpers/db')
    const client = { db: () => ({ collection: (name: string) => collection(name) }) }
    return { default: () => Promise.resolve(client), getMongoClient: () => Promise.resolve(client) }
})

const hash = vi.hoisted(() => vi.fn(async (value: string) => `hashed:${value}`))
const compare = vi.hoisted(() => vi.fn())
vi.mock('bcryptjs', () => ({ default: { hash, compare }, hash, compare }))

const { POST } = await import('@/app/api/signup/route')

function request(body: unknown) {
    return new Request('http://localhost/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

const VALID = { email: 'new@example.com', password: 'abcd1234' }

beforeEach(() => {
    collection('users').findOne.mockResolvedValue(null)
    collection('users').insertOne.mockResolvedValue({ acknowledged: true, insertedId: 'new-id' })
})

describe('POST /api/signup', () => {
    describe('輸入驗證', () => {
        it.each([
            ['缺 email', { password: 'abcd1234' }],
            ['缺 password', { email: 'new@example.com' }],
            ['password 太短', { email: 'new@example.com', password: 'ab1' }],
        ])('%s 時回 400', async (_label, body) => {
            const response = await POST(request(body))

            expect(response.status).toBe(400)
            expect(collection('users').insertOne).not.toHaveBeenCalled()
        })

        it('Email 格式錯誤時回 400 並附上訊息', async () => {
            const response = await POST(request({ email: 'not-an-email', password: 'abcd1234' }))

            expect(response.status).toBe(400)
            expect(await response.text()).toContain('請輸入正確的 Email 格式')
        })

        it('密碼只有英文沒有數字時回 400', async () => {
            const response = await POST(request({ email: 'new@example.com', password: 'abcdefgh' }))

            expect(response.status).toBe(400)
            expect(await response.text()).toContain('密碼須包含英文和數字')
        })

        it('密碼只有數字沒有英文時回 400', async () => {
            const response = await POST(request({ email: 'new@example.com', password: '12345678' }))

            expect(response.status).toBe(400)
        })

        it('request body 不是合法 JSON 時回 500 而不是崩潰', async () => {
            const bad = new Request('http://localhost/api/signup', {
                method: 'POST',
                body: 'not json',
            })

            expect((await POST(bad)).status).toBe(500)
        })
    })

    describe('註冊流程', () => {
        it('成功時建立使用者', async () => {
            const response = await POST(request(VALID))

            expect(response.status).toBe(200)
            expect(collection('users').insertOne).toHaveBeenCalledOnce()
        })

        it('密碼經過雜湊才存進資料庫，不存明碼', async () => {
            await POST(request(VALID))

            expect(hash).toHaveBeenCalledWith('abcd1234', 12)
            const inserted = collection('users').insertOne.mock.calls[0]?.[0]
            expect(inserted.password).toBe('hashed:abcd1234')
            expect(inserted.password).not.toBe('abcd1234')
        })

        it('Email 已被註冊時回 400，且錯誤訊息不透露該帳號已存在', async () => {
            collection('users').findOne.mockResolvedValue({ email: VALID.email })

            const response = await POST(request(VALID))
            const body = await response.json()

            expect(response.status).toBe(400)
            // 與驗證失敗回同一句話，避免被拿來列舉哪些 Email 已註冊
            expect(body.error).toBe('Invalid email or password')
            expect(collection('users').insertOne).not.toHaveBeenCalled()
        })

        it('資料庫出錯時回 500，不外洩內部錯誤細節', async () => {
            collection('users').insertOne.mockRejectedValue(new Error('連線字串錯誤'))

            const response = await POST(request(VALID))
            const body = await response.json()

            expect(response.status).toBe(500)
            expect(body).toEqual({ error: 'Internal server error' })
        })
    })
})
