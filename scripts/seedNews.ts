/**
 * 種子腳本 — 將 newsData 靜態資料匯入 MongoDB 的 news collection
 *
 * 使用方式：
 *   npx tsx scripts/seedNews.ts
 */
import 'dotenv/config'
import { config } from 'dotenv'
import { resolve } from 'path'
import { MongoClient, ServerApiVersion } from 'mongodb'
import dns from 'dns'
import { newsData } from '../libs/datas/newsData'

// 載入 .env.local
config({ path: resolve(process.cwd(), '.env.local') })

dns.setServers(['8.8.8.8', '8.8.4.4'])

const uri = process.env.MONGODB_URI
if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable')
}

async function seed() {
    const client = new MongoClient(uri!, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    })

    try {
        await client.connect()
        console.log('✅ MongoDB connected')

        const db = client.db()
        const newsCollection = db.collection('news')

        // 檢查是否已有資料
        const existingCount = await newsCollection.countDocuments()
        if (existingCount > 0) {
            console.log(`⚠️  news collection 已有 ${existingCount} 筆資料`)
            const answer = process.argv.includes('--force')
            if (!answer) {
                console.log('如需強制覆蓋，請加上 --force 參數')
                console.log('  npx tsx scripts/seedNews.ts --force')
                return
            }
            console.log('🗑️  清除舊資料...')
            await newsCollection.deleteMany({})
        }

        // 以 article_id 作為唯一識別，建立索引
        await newsCollection.createIndex({ article_id: 1 }, { unique: true })

        // 插入資料
        const docs = newsData.results.map((item) => ({
            ...item,
            _importedAt: new Date(),
        }))

        const result = await newsCollection.insertMany(docs)
        console.log(`🎉 成功匯入 ${result.insertedCount} 筆新聞資料到 news collection`)
    } catch (error) {
        console.error('❌ Seed 失敗:', error)
    } finally {
        await client.close()
        console.log('🔌 MongoDB 連線已關閉')
    }
}

seed()
