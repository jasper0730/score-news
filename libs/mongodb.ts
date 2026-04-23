import { MongoClient, ServerApiVersion } from 'mongodb'
import dns from 'dns'
import { promisify } from 'util'

// 使用公共 DNS 解析 MongoDB Atlas SRV 記錄（解決本地路由器 DNS 不支援 SRV 查詢的問題）
// 注意：dns.setServers() 在 Next.js worker thread 中可能不生效，因此改用明確指定 resolver
const resolver = new dns.Resolver()
resolver.setServers(['1.1.1.1', '8.8.8.8', '8.8.4.4'])
const resolveSrv = promisify(resolver.resolveSrv.bind(resolver))
const resolveTxt = promisify(resolver.resolveTxt.bind(resolver))

const options = {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
}

const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient
    _mongoClientPromise?: Promise<MongoClient>
}

async function createClient(): Promise<MongoClient> {
    if (!process.env.MONGODB_URI) {
        throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
    }
    const uri = process.env.MONGODB_URI
    let connectionUri = uri

    // 若使用 mongodb+srv:// 則手動解析 SRV，避免 Next.js 環境 DNS 問題
    if (uri.startsWith('mongodb+srv://')) {
        try {
            const match = uri.match(/mongodb\+srv:\/\/([^@]+)@([^/]+)\/(.*)/)
            if (match) {
                const credentials = match[1]
                const host = match[2]
                const rest = match[3]

                const srvHost = `_mongodb._tcp.${host}`
                const [srvRecords, txtRecords] = await Promise.all([
                    resolveSrv(srvHost),
                    resolveTxt(host).catch(() => [] as string[][]),
                ])

                const hosts = srvRecords
                    .map((r) => `${r.name}:${r.port}`)
                    .join(',')

                // 從 TXT 記錄取得 authSource 和 replicaSet 等參數
                const txtOptions = (txtRecords.flat() as string[])
                    .join('')
                    .replace(/^authSource=/, 'authSource=')

                const dbName = rest.split('?')[0]
                connectionUri = `mongodb://${credentials}@${hosts}/${dbName}?ssl=true&${txtOptions}&retryWrites=true&w=majority`
            }
        } catch (err) {
            console.warn('[MongoDB] SRV 解析失敗，使用原始 URI:', err)
            // fallback 回原始 URI
        }
    }

    const client = new MongoClient(connectionUri, options)
    await client.connect()
    return client
}

let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
    if (!globalWithMongo._mongoClientPromise) {
        globalWithMongo._mongoClientPromise = createClient()
    }
    clientPromise = globalWithMongo._mongoClientPromise
} else {
    clientPromise = createClient()
}

export default clientPromise
