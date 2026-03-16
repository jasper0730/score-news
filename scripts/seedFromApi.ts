/**
 * 從 Newsdata.io API 抓取新聞並匯入 MongoDB
 * 使用方式：npx tsx scripts/seedFromApi.ts
 * 強制覆蓋：npx tsx scripts/seedFromApi.ts --force
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { MongoClient, ServerApiVersion } from 'mongodb'
import dns from 'dns'

config({ path: resolve(process.cwd(), '.env.local') })
dns.setServers(['8.8.8.8', '8.8.4.4'])

const MONGODB_URI = process.env.MONGODB_URI!
const API_KEY = process.env.NEWSDATA_API_KEY!
const TARGET = 50

if (!MONGODB_URI) throw new Error('Missing MONGODB_URI')
if (!API_KEY) throw new Error('Missing NEWSDATA_API_KEY')

async function fetchPage(nextPage?: string) {
    const url = new URL('https://newsdata.io/api/1/latest')
    url.searchParams.set('apikey', API_KEY)
    url.searchParams.set('language', 'zh')
    url.searchParams.set('size', '10')
    if (nextPage) url.searchParams.set('page', nextPage)

    const res = await fetch(url.toString())
    return res.json() as Promise<{ status: string; results: object[]; nextPage?: string }>
}

async function seed() {
    const client = new MongoClient(MONGODB_URI, {
        serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    })

    try {
        await client.connect()
        console.log('✅ MongoDB connected')

        const collection = client.db().collection('news')

        const existingCount = await collection.countDocuments()
        if (existingCount > 0) {
            if (!process.argv.includes('--force')) {
                console.log(`⚠️  已有 ${existingCount} 筆資料，請加上 --force 強制覆蓋`)
                return
            }
            console.log('🗑️  清除舊資料...')
            await collection.deleteMany({})
        }

        await collection.createIndex({ article_id: 1 }, { unique: true })

        const allItems: object[] = []
        let nextPage: string | undefined = undefined

        while (allItems.length < TARGET) {
            process.stdout.write(`⏳ 抓取中... ${allItems.length}/${TARGET}\r`)
            const data = await fetchPage(nextPage)

            if (data.status !== 'success' || !data.results?.length) {
                console.log('\n⚠️  API 回傳異常，停止抓取')
                break
            }

            allItems.push(...data.results)
            nextPage = data.nextPage

            if (!nextPage) break
            // 避免 rate limit
            await new Promise(r => setTimeout(r, 500))
        }

        const docs = allItems.slice(0, TARGET).map(item => ({
            ...item,
            _importedAt: new Date(),
        }))

        const result = await collection.insertMany(docs, { ordered: false })
        console.log(`\n🎉 成功匯入 ${result.insertedCount} 筆新聞到 news collection`)
    } catch (error) {
        console.error('\n❌ Seed 失敗:', error)
    } finally {
        await client.close()
        console.log('🔌 MongoDB 連線已關閉')
    }
}

seed()
