import type { AnyBulkWriteOperation } from 'mongodb'
import { getCollection, type NewsDocument } from '@/libs/db'
import { FEED_SOURCES, type FeedSource } from '@/libs/rss/sources'
import { parseFeed, type FeedItem } from '@/libs/rss/parser'
import { fetchOgImages } from '@/libs/rss/ogImage'
import { buildArticleId, FALLBACK_IMAGE, toNewsDocument } from '@/libs/rss/toNewsDocument'

const USER_AGENT =
    'Mozilla/5.0 (compatible; ScoreNewsBot/0.1; +https://github.com/jasper0730/score-news)'
const FEED_TIMEOUT_MS = 15000

export interface IngestStats {
    feedsOk: number
    feedsFailed: number
    /** 解析出的項目總數（含跨 feed 重複） */
    itemsParsed: number
    /** 去重後實際處理的文章數 */
    uniqueArticles: number
    inserted: number
    updated: number
    /** 為了補圖實際打出去的文章頁請求數 */
    imagesFetched: number
    errors: string[]
}

export interface IngestOptions {
    sources?: FeedSource[]
    /** 同時抓取的 feed 數 */
    concurrency?: number
    /** 同時抓取的文章頁數（補圖用） */
    imageConcurrency?: number
    now?: Date
    /** 進度回報。首次匯入要補上千張圖，沒有它完全看不出是在跑還是卡住 */
    onProgress?: (message: string) => void
    /** 測試注入用 */
    fetchFeed?: (url: string) => Promise<string>
    fetchImages?: typeof fetchOgImages
}

async function defaultFetchFeed(url: string): Promise<string> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS)
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT },
            signal: controller.signal,
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.text()
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

interface PendingArticle {
    item: FeedItem
    source: FeedSource
    articleId: string
}

/**
 * 組出單篇文章的 upsert 操作。
 *
 * 兩個欄位絕對不能被例行更新蓋掉：
 * - views 是使用者行為累積的，只在建立時給 0
 * - image_url 只有在這次真的拿到圖時才更新，否則補圖失敗會把既有的好圖
 *   換成預設圖（$set 與 $setOnInsert 不能同時指定同一個欄位，因此分兩路寫）
 */
export function buildUpsertOperation(
    article: PendingArticle,
    ogImage: string | null,
    now: Date
): AnyBulkWriteOperation<NewsDocument> {
    const doc = toNewsDocument(article.item, article.source, { ogImage, now })
    const { article_id, image_url, ...rest } = doc
    const hasRealImage = image_url !== FALLBACK_IMAGE

    return {
        updateOne: {
            filter: { article_id },
            update: {
                $set: hasRealImage ? { ...rest, image_url } : rest,
                $setOnInsert: hasRealImage
                    ? { article_id, views: 0 }
                    : { article_id, views: 0, image_url },
            },
            upsert: true,
        },
    } as AnyBulkWriteOperation<NewsDocument>
}

/**
 * 抓取所有來源、去重後 upsert 進資料庫。
 *
 * 刻意不刪除任何既有文章：ratings / comments / favorites 都以 article_id
 * 關聯，刪掉新聞會讓使用者的評分與留言變成查不到對應內容的孤兒資料。
 */
export async function ingestNews(options: IngestOptions = {}): Promise<IngestStats> {
    const {
        sources = FEED_SOURCES,
        concurrency = 4,
        imageConcurrency = 5,
        now = new Date(),
        onProgress = () => {},
        fetchFeed = defaultFetchFeed,
        fetchImages = fetchOgImages,
    } = options

    const stats: IngestStats = {
        feedsOk: 0,
        feedsFailed: 0,
        itemsParsed: 0,
        uniqueArticles: 0,
        inserted: 0,
        updated: 0,
        imagesFetched: 0,
        errors: [],
    }

    // 1. 抓取並解析所有 feed。單一 feed 失敗不影響其他來源。
    const byArticleId = new Map<string, PendingArticle>()

    await pool(sources, concurrency, async (source) => {
        try {
            const items = parseFeed(await fetchFeed(source.url))
            stats.feedsOk++
            stats.itemsParsed += items.length

            for (const item of items) {
                const articleId = buildArticleId(source.outlet, item)
                // 同一篇常同時出現在「即時」與分類 feed 裡，只留第一次見到的
                if (!byArticleId.has(articleId)) {
                    byArticleId.set(articleId, { item, source, articleId })
                }
            }
        } catch (error) {
            stats.feedsFailed++
            const message = error instanceof Error ? error.message : String(error)
            stats.errors.push(`${source.outletName} ${source.category}: ${message}`)
        }
    })

    const articles = [...byArticleId.values()]
    stats.uniqueArticles = articles.length
    onProgress(
        `抓取完成：${stats.feedsOk} 個 feed，${stats.itemsParsed} 則，去重後 ${articles.length} 篇`
    )
    if (articles.length === 0) return stats

    const news = await getCollection<NewsDocument>('news')

    // 2. 查出已存在的文章。已經在庫裡的不需要再補圖——圖片不會變，
    //    而補圖是整個流程最貴的部分（每篇一次 HTTP 請求）。
    const existing = await news
        .find(
            { article_id: { $in: articles.map((a) => a.articleId) } },
            { projection: { article_id: 1 } }
        )
        .toArray()
    const existingIds = new Set(existing.map((doc) => doc.article_id))

    // 3. 只為「新文章」且「feed 沒給圖」的來源抓 og:image
    const needImage = articles.filter(
        (a) => !existingIds.has(a.articleId) && a.source.imageSource === 'page' && !a.item.imageUrl
    )
    onProgress(`需要補圖 ${needImage.length} 篇（已在庫的 ${existingIds.size} 篇略過）`)
    const imageMap = await fetchImages(
        needImage.map((a) => a.item.link),
        imageConcurrency
    )
    stats.imagesFetched = needImage.length
    onProgress(`補圖完成：取得 ${imageMap.size} / ${needImage.length}`)

    // 4. 一次寫入
    const operations = articles.map((article) =>
        buildUpsertOperation(article, imageMap.get(article.item.link) ?? null, now)
    )

    const result = await news.bulkWrite(operations, { ordered: false })
    stats.inserted = result.upsertedCount ?? 0
    stats.updated = result.modifiedCount ?? 0

    return stats
}
