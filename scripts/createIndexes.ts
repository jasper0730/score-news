/**
 * 建立查詢所需的索引
 *
 * 使用方式：
 *   npx tsx scripts/createIndexes.ts
 *
 * createIndex 具冪等性，重複執行安全；索引已存在時 MongoDB 直接略過。
 * 每個索引都對應到程式中實際存在的查詢，行末註明出處。
 */
import 'dotenv/config'
import { config } from 'dotenv'
import { resolve } from 'path'
import {
    MongoClient,
    ServerApiVersion,
    type IndexSpecification,
    type CreateIndexesOptions,
} from 'mongodb'
import dns from 'dns'

config({ path: resolve(process.cwd(), '.env.local') })

dns.setServers(['8.8.8.8', '8.8.4.4'])

const uri = process.env.MONGODB_URI
if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable')
}

interface IndexPlan {
    collection: string
    keys: IndexSpecification
    options?: CreateIndexesOptions
    reason: string
}

const PLANS: IndexPlan[] = [
    {
        collection: 'news',
        keys: { article_id: 1 },
        options: { unique: true, name: 'article_id_unique' },
        reason: 'getNewsByIds 的 $in 查詢；同時保證文章不重複',
    },
    {
        collection: 'news',
        keys: { pubDate: -1 },
        options: { name: 'pubDate_desc' },
        reason: 'getNewsActions 依日期排序，每次首頁載入都會用到',
    },
    {
        collection: 'news',
        keys: { views: -1 },
        options: { name: 'views_desc' },
        reason: '「最熱門」排序',
    },
    {
        collection: 'ratings',
        keys: { postId: 1 },
        options: { name: 'postId' },
        reason: '平均評分聚合的 $match { postId: { $in: [...] } }',
    },
    {
        collection: 'ratings',
        keys: { userId: 1, postId: 1 },
        options: { unique: true, name: 'userId_postId_unique' },
        reason: '查使用者個人評分；唯一性可從資料層擋掉同一人重複評分',
    },
    {
        collection: 'favorites',
        keys: { userId: 1 },
        options: { unique: true, name: 'userId_unique' },
        reason: 'findOne({ userId })；一位使用者只該有一份收藏文件',
    },
    {
        collection: 'likes',
        keys: { postId: 1 },
        options: { name: 'postId' },
        reason: '按讚總數的 $match { postId: { $in: [...] } } 與 countDocuments',
    },
    {
        collection: 'likes',
        keys: { userId: 1, postId: 1 },
        options: { unique: true, name: 'userId_postId_unique' },
        reason: '查使用者按過哪些；唯一性可從資料層擋掉併發造成的重複計數',
    },
    {
        collection: 'comments',
        keys: { postId: 1, createdAt: -1 },
        options: { name: 'postId_createdAt' },
        reason: '文章評論列表：先篩 postId 再依時間排序，複合索引可一次滿足',
    },
    {
        collection: 'comments',
        keys: { userId: 1, createdAt: -1 },
        options: { name: 'userId_createdAt' },
        reason: '後台「我的評論」',
    },
    {
        collection: 'users',
        keys: { email: 1 },
        options: { unique: true, name: 'email_unique' },
        reason: 'getUser 與登入驗證都以 email 查詢；唯一性可擋重複註冊',
    },
]

async function createIndexes() {
    const client = new MongoClient(uri!, {
        serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    })

    try {
        await client.connect()
        const db = client.db()
        console.log('已連線，開始建立索引\n')

        for (const plan of PLANS) {
            const label = `${plan.collection}.${JSON.stringify(plan.keys)}`
            try {
                const name = await db
                    .collection(plan.collection)
                    .createIndex(plan.keys, plan.options)
                console.log(`  OK    ${label}  -> ${name}`)
                console.log(`        ${plan.reason}`)
            } catch (error) {
                // 唯一索引可能因既有的重複資料而失敗，這種情況需要人工處理，
                // 因此只記錄不中斷，讓其餘索引照常建立
                const message = error instanceof Error ? error.message : String(error)
                console.error(`  FAIL  ${label}`)
                console.error(`        ${message}`)
            }
        }

        console.log('\n完成。目前各 collection 的索引：')
        for (const name of [...new Set(PLANS.map((p) => p.collection))]) {
            const indexes = await db.collection(name).indexes()
            console.log(`  ${name}: ${indexes.map((i) => i.name).join(', ')}`)
        }
    } finally {
        await client.close()
    }
}

createIndexes().catch((error) => {
    console.error(error)
    process.exit(1)
})
