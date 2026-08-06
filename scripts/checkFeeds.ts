/**
 * RSS 來源健康檢查
 *
 * 使用方式：
 *   npx tsx scripts/checkFeeds.ts
 *
 * 逐一連線 FEED_SOURCES 裡的每個 feed，回報可否解析、取到幾則、有無圖片與日期。
 * 媒體改版或停掉 feed 時不會有人通知我們，只能靠這支定期跑一次來發現。
 * 只讀不寫，不會碰資料庫。
 */
import { FEED_SOURCES } from '../libs/rss/sources'
import { parseFeed } from '../libs/rss/parser'
import { toNewsDocument } from '../libs/rss/toNewsDocument'

const USER_AGENT =
    'Mozilla/5.0 (compatible; ScoreNewsBot/0.1; +https://github.com/jasper0730/score-news)'
const TIMEOUT_MS = 15000
const CONCURRENCY = 4

interface CheckResult {
    label: string
    ok: boolean
    count: number
    withImage: number
    withDate: number
    note: string
}

async function fetchText(url: string): Promise<string> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT },
            signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return await res.text()
    } finally {
        clearTimeout(timer)
    }
}

/** 限制併發，避免同時對單一站台送出大量請求 */
async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = []
    let cursor = 0
    await Promise.all(
        Array.from({ length: Math.min(limit, items.length) }, async () => {
            while (cursor < items.length) {
                const index = cursor++
                results[index] = await fn(items[index]!)
            }
        })
    )
    return results
}

async function check(source: (typeof FEED_SOURCES)[number]): Promise<CheckResult> {
    const label = `${source.outletName} ${source.category}`
    try {
        const xml = await fetchText(source.url)
        const items = parseFeed(xml)

        if (items.length === 0) {
            return { label, ok: false, count: 0, withImage: 0, withDate: 0, note: '解析不到項目' }
        }

        // 順便驗證映射不會拋錯，並確認 article_id 在同一個 feed 內不重複
        const docs = items.map((item) => toNewsDocument(item, source))
        const uniqueIds = new Set(docs.map((d) => d.article_id))
        const note =
            uniqueIds.size === docs.length
                ? ''
                : `⚠ article_id 重複 ${docs.length - uniqueIds.size} 筆`

        return {
            label,
            ok: true,
            count: items.length,
            withImage: items.filter((i) => i.imageUrl).length,
            withDate: items.filter((i) => i.pubDate).length,
            note,
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
            label,
            ok: false,
            count: 0,
            withImage: 0,
            withDate: 0,
            note: message === 'The operation was aborted.' ? 'timeout' : message,
        }
    }
}

async function main() {
    console.log(`檢查 ${FEED_SOURCES.length} 個 feed...\n`)
    const results = await pool(FEED_SOURCES, CONCURRENCY, check)

    for (const r of results) {
        if (!r.ok) {
            console.log(`✗ ${r.label.padEnd(22)} ${r.note}`)
            continue
        }
        const img = `${r.withImage}/${r.count}`
        const date = r.withDate === r.count ? '' : ` 日期缺 ${r.count - r.withDate}`
        console.log(
            `✓ ${r.label.padEnd(22)} ${String(r.count).padStart(3)} 則  圖 ${img}${date} ${r.note}`
        )
    }

    const failed = results.filter((r) => !r.ok)
    const total = results.reduce((sum, r) => sum + r.count, 0)
    console.log(
        `\n可用 ${results.length - failed.length}/${results.length} 個 feed，共 ${total} 則`
    )

    if (failed.length > 0) {
        console.log(`失敗：${failed.map((f) => f.label).join('、')}`)
        process.exitCode = 1
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
