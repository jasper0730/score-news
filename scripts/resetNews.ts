/**
 * ⚠️ 破壞性操作：清空新聞與所有以 article_id 關聯的使用者資料
 *
 * 使用方式：
 *   npx tsx scripts/resetNews.ts --yes-i-really-mean-it
 *
 * 為什麼連使用者資料一起清：
 * ratings、comments、favorites.postIds 全都以 article_id 關聯新聞。
 * 只清 news 的話，這些資料會留在資料庫裡但永遠查不到對應的新聞——
 * 不會報錯，只是使用者的評分與留言從此人間蒸發，而且會一直佔著
 * userId + postId 的唯一索引，讓之後對同一篇的評分寫不進去。
 *
 * 這支腳本是為了從 NewsData.io 切換到 RSS 而寫的一次性工具。
 * 正式上線後不該再執行——ingestNews 只做 upsert，本來就不需要先清空。
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import dns from 'dns'
import { MongoClient, ServerApiVersion } from 'mongodb'

config({ path: resolve(process.cwd(), '.env.local') })
dns.setServers(['8.8.8.8', '8.8.4.4'])

const CONFIRM_FLAG = '--yes-i-really-mean-it'

async function main() {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('Missing MONGODB_URI environment variable')

    if (!process.argv.includes(CONFIRM_FLAG)) {
        console.log('這會刪除所有新聞，以及所有評分、評論與收藏。')
        console.log(`確定要執行請加上 ${CONFIRM_FLAG}`)
        process.exitCode = 1
        return
    }

    const client = new MongoClient(uri, {
        serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    })

    try {
        await client.connect()
        const db = client.db()

        // 先顯示將被刪除的量，執行紀錄裡才留得下痕跡
        for (const name of ['news', 'ratings', 'comments', 'favorites']) {
            console.log(`${name.padEnd(10)} 目前 ${await db.collection(name).countDocuments()} 筆`)
        }

        console.log('\n開始清除...')
        for (const name of ['news', 'ratings', 'comments'] as const) {
            const result = await db.collection(name).deleteMany({})
            console.log(`  ${name.padEnd(10)} 刪除 ${result.deletedCount} 筆`)
        }

        // favorites 是一位使用者一份文件，文件本身要留著（保留唯一索引與使用者關聯），
        // 只把指向舊新聞的 postIds 清空
        const favorites = await db.collection('favorites').updateMany({}, { $set: { postIds: [] } })
        console.log(`  favorites  清空 ${favorites.modifiedCount} 位使用者的收藏清單`)

        console.log('\n完成。接著執行：npx tsx scripts/ingestNews.ts')
    } finally {
        await client.close()
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
