import { MongoClient, ServerApiVersion } from 'mongodb'
import dns from 'dns'

// 使用 Google DNS 解析 MongoDB Atlas SRV 記錄（解決本地路由器 DNS 不支援 SRV 查詢的問題）
dns.setServers(['8.8.8.8', '8.8.4.4'])

if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
}

let client: MongoClient

const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient
}

let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
    if (!globalWithMongo._mongoClient) {
        globalWithMongo._mongoClient = new MongoClient(uri, options)
    }
    client = globalWithMongo._mongoClient
    clientPromise = client.connect()
} else {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
}

export default clientPromise
