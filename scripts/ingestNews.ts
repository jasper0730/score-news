/**
 * 從 RSS 抓取新聞並寫入資料庫
 *
 * 使用方式：
 *   npx tsx scripts/ingestNews.ts
 *
 * 只做 upsert，不刪除任何既有文章——ratings / comments / favorites 都以
 * article_id 關聯，刪掉新聞會讓使用者的評分與留言變成孤兒資料。
 * 重複執行是安全的。
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import dns from 'dns'

config({ path: resolve(process.cwd(), '.env.local') })
dns.setServers(['8.8.8.8', '8.8.4.4'])

async function main() {
    if (!process.env.MONGODB_URI) {
        throw new Error('Missing MONGODB_URI environment variable')
    }

    // 動態載入：ingest 會連帶載入 libs/db，而它在 import 當下就需要 MONGODB_URI，
    // 因此必須等 dotenv 設定完成後才載入
    const { ingestNews } = await import('../libs/rss/ingest')
    const { closeMongoClient } = await import('../libs/mongodb')

    const startedAt = Date.now()
    try {
        const stats = await ingestNews({
            // 首次匯入要補上千張圖，沒有進度回報時完全看不出是在跑還是卡住
            onProgress: (message) => console.log(message),
        })
        const seconds = ((Date.now() - startedAt) / 1000).toFixed(1)

        console.log(`\nfeed        ${stats.feedsOk} 成功 / ${stats.feedsFailed} 失敗`)
        console.log(`解析        ${stats.itemsParsed} 則，去重後 ${stats.uniqueArticles} 篇`)
        console.log(`補圖        ${stats.imagesFetched} 次文章頁請求`)
        console.log(`寫入        新增 ${stats.inserted}，更新 ${stats.updated}`)
        console.log(`耗時        ${seconds}s`)

        if (stats.errors.length > 0) {
            console.log('\n失敗的來源：')
            for (const error of stats.errors) console.log(`  ${error}`)
        }

        // 全部 feed 都掛掉才視為失敗；個別來源失效不該讓排程一直紅燈
        if (stats.feedsOk === 0) {
            console.error('\n所有來源都抓取失敗')
            process.exitCode = 1
        }
    } finally {
        // 不關連線的話，工作做完行程也不會退出——在 CI 上就是跑到 timeout 被判失敗
        await closeMongoClient()
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
