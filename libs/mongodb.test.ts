import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const connect = vi.hoisted(() => vi.fn())
const MongoClient = vi.hoisted(() =>
    vi.fn(function (this: Record<string, unknown>, uri: string) {
        this.uri = uri
        this.connect = connect
    })
)
vi.mock('mongodb', () => ({
    MongoClient,
    ServerApiVersion: { v1: '1' },
}))

const resolveSrv = vi.hoisted(() => vi.fn())
const resolveTxt = vi.hoisted(() => vi.fn())
vi.mock('dns', () => ({
    default: {
        Resolver: class {
            setServers = vi.fn()
            resolveSrv = resolveSrv
            resolveTxt = resolveTxt
        },
    },
}))

// promisify 會把上面的 callback 版本包起來，測試裡直接用 promise 版本比較好控制
vi.mock('util', () => ({
    promisify: (fn: (...args: unknown[]) => unknown) => fn,
}))

type GlobalWithMongo = typeof globalThis & {
    _mongoClientPromise?: Promise<unknown>
}

/** 每個測試都要拿到全新的模組狀態，因為連線 promise 是快取在 globalThis 上的 */
async function loadModule() {
    vi.resetModules()
    delete (globalThis as GlobalWithMongo)._mongoClientPromise
    return (await import('@/libs/mongodb')).default
}

beforeEach(() => {
    vi.stubEnv('MONGODB_URI', 'mongodb://user:pass@localhost:27017/newsdb')
    connect.mockResolvedValue(undefined)
    resolveSrv.mockResolvedValue([{ name: 'shard0.example.com', port: 27017 }])
    resolveTxt.mockResolvedValue([['authSource=admin&replicaSet=rs0']])
})

afterEach(() => {
    delete (globalThis as GlobalWithMongo)._mongoClientPromise
})

describe('getMongoClient', () => {
    it('缺少 MONGODB_URI 時明確報錯', async () => {
        vi.stubEnv('MONGODB_URI', '')
        const getMongoClient = await loadModule()

        await expect(getMongoClient()).rejects.toThrow('Invalid/Missing environment variable')
    })

    it('建立連線並回傳 client', async () => {
        const getMongoClient = await loadModule()

        await getMongoClient()

        expect(MongoClient).toHaveBeenCalledOnce()
        expect(connect).toHaveBeenCalledOnce()
    })

    it('重複呼叫共用同一條連線，不會每次都重連', async () => {
        const getMongoClient = await loadModule()

        const [first, second] = await Promise.all([getMongoClient(), getMongoClient()])

        expect(first).toBe(second)
        expect(MongoClient).toHaveBeenCalledOnce()
    })

    it('連線失敗時清掉快取，修好設定後不必重啟就能恢復', async () => {
        // 失敗的 promise 若留在 globalThis 上，之後即使 .env 改對了也一定要重啟才會好
        const getMongoClient = await loadModule()
        connect.mockRejectedValueOnce(new Error('認證失敗'))

        await expect(getMongoClient()).rejects.toThrow('認證失敗')

        connect.mockResolvedValue(undefined)
        await expect(getMongoClient()).resolves.toBeDefined()
        expect(MongoClient).toHaveBeenCalledTimes(2)
    })
})

describe('mongodb+srv 連線字串', () => {
    const SRV_URI = 'mongodb+srv://user:pass@cluster.example.com/newsdb?retryWrites=true'

    it('自行解析 SRV 記錄，改用一般 mongodb:// 連線', async () => {
        vi.stubEnv('MONGODB_URI', SRV_URI)
        const getMongoClient = await loadModule()

        await getMongoClient()

        expect(resolveSrv).toHaveBeenCalledWith('_mongodb._tcp.cluster.example.com')
        const uri = MongoClient.mock.calls[0]?.[0] as string
        expect(uri).toContain('mongodb://user:pass@shard0.example.com:27017/newsdb')
        expect(uri).toContain('authSource=admin')
    })

    it('SRV 解析失敗時退回原始 URI，而不是整個連不上', async () => {
        vi.stubEnv('MONGODB_URI', SRV_URI)
        resolveSrv.mockRejectedValue(new Error('DNS 查不到'))
        const getMongoClient = await loadModule()

        await getMongoClient()

        expect(MongoClient).toHaveBeenCalledWith(SRV_URI, expect.anything())
    })

    it('TXT 記錄查不到時仍能建立連線', async () => {
        vi.stubEnv('MONGODB_URI', SRV_URI)
        resolveTxt.mockRejectedValue(new Error('沒有 TXT'))
        const getMongoClient = await loadModule()

        await getMongoClient()

        expect(MongoClient.mock.calls[0]?.[0]).toContain('shard0.example.com:27017')
    })

    it('一般 mongodb:// 連線字串不做 SRV 解析', async () => {
        const getMongoClient = await loadModule()

        await getMongoClient()

        expect(resolveSrv).not.toHaveBeenCalled()
    })
})
