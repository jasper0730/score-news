import { beforeEach, describe, expect, it, vi } from 'vitest'
import { collection } from '@/test/helpers/db'
import type { FeedSource } from '@/libs/rss/sources'

vi.mock('@/libs/db', async () => ({
    getCollection: (await import('@/test/helpers/db')).getCollection,
}))

const { ingestNews, buildUpsertOperation } = await import('@/libs/rss/ingest')
const { FALLBACK_IMAGE } = await import('@/libs/rss/toNewsDocument')

const withImage: FeedSource = {
    outlet: 'udn',
    outletName: '聯合新聞網',
    siteUrl: 'https://udn.com',
    iconUrl: 'https://udn.com/favicon.ico',
    category: '要聞',
    url: 'https://udn.com/news/rssfeed',
    imageSource: 'feed',
}

const needsPageImage: FeedSource = {
    outlet: 'cna',
    outletName: '中央社',
    siteUrl: 'https://www.cna.com.tw',
    iconUrl: 'https://www.cna.com.tw/favicon.ico',
    category: '政治',
    url: 'https://feeds.feedburner.com/rsscna/politics',
    imageSource: 'page',
}

/** 產生一個含 n 則項目的 RSS，image 為 true 時每則都帶圖 */
function makeFeedXml(links: string[], image = false) {
    const items = links
        .map(
            (link, i) => `<item>
                <title>標題 ${i}</title>
                <link>${link}</link>
                <guid>guid-${i}</guid>
                <pubDate>Thu, 06 Aug 2026 09:00:0${i} +0800</pubDate>
                <description>摘要 ${i}</description>
                ${image ? `<enclosure url="https://cdn.example.com/${i}.jpg" type="image/jpeg" />` : ''}
            </item>`
        )
        .join('')
    return `<?xml version="1.0"?><rss><channel>${items}</channel></rss>`
}

/** 補圖替身。帶上簽章，斷言才能檢查實際傳進去的連結清單 */
type FetchImages = (urls: string[], concurrency?: number) => Promise<Map<string, string>>
const makeImageFetcher = () => vi.fn<FetchImages>(async () => new Map())

const noImages = makeImageFetcher()

/**
 * buildUpsertOperation 的回傳型別是 mongodb 的聯集，測試要看的是實際結構。
 * 用具名型別而非 Record 索引存取——後者在 noUncheckedIndexedAccess 下
 * 每個欄位都會帶 undefined，斷言會被型別噪音淹沒。
 */
interface UpsertOp {
    updateOne: {
        filter: { article_id: string }
        update: {
            $set: Record<string, unknown>
            $setOnInsert: Record<string, unknown>
        }
        upsert: boolean
    }
}
const asUpsert = (op: unknown) => op as UpsertOp

beforeEach(() => {
    collection('news').cursor.toArray.mockResolvedValue([])
})

describe('ingestNews 抓取與解析', () => {
    it('回報成功的 feed 數與解析出的項目數', async () => {
        const fetchFeed = vi.fn(async () => makeFeedXml(['https://a.com/1', 'https://a.com/2']))

        const stats = await ingestNews({
            sources: [withImage],
            fetchFeed,
            fetchImages: noImages,
        })

        expect(stats.feedsOk).toBe(1)
        expect(stats.itemsParsed).toBe(2)
        expect(stats.uniqueArticles).toBe(2)
    })

    it('單一 feed 失敗不影響其他來源', async () => {
        const fetchFeed = vi.fn(async (url: string) => {
            if (url.includes('cna')) throw new Error('HTTP 503')
            return makeFeedXml(['https://a.com/1'])
        })

        const stats = await ingestNews({
            sources: [withImage, needsPageImage],
            fetchFeed,
            fetchImages: noImages,
        })

        expect(stats.feedsOk).toBe(1)
        expect(stats.feedsFailed).toBe(1)
        expect(stats.errors[0]).toContain('HTTP 503')
        expect(stats.uniqueArticles).toBe(1)
    })

    it('同一篇出現在多個 feed 時只處理一次', async () => {
        // 「即時」與分類 feed 常常包含同一篇文章
        const fetchFeed = vi.fn(async () => makeFeedXml(['https://a.com/1']))
        const sources = [withImage, { ...withImage, category: '政治', url: 'https://udn.com/b' }]

        const stats = await ingestNews({ sources, fetchFeed, fetchImages: noImages })

        expect(stats.itemsParsed).toBe(2)
        expect(stats.uniqueArticles).toBe(1)
    })

    it('全部 feed 都失敗時不會去寫資料庫', async () => {
        const fetchFeed = vi.fn(async () => {
            throw new Error('斷線')
        })

        const stats = await ingestNews({ sources: [withImage], fetchFeed, fetchImages: noImages })

        expect(stats.uniqueArticles).toBe(0)
        expect(collection('news').bulkWrite).not.toHaveBeenCalled()
    })
})

describe('ingestNews 補圖', () => {
    it('只為新文章補圖——已在庫裡的圖片不會變，補圖是最貴的步驟', async () => {
        const fetchFeed = vi.fn(async () => makeFeedXml(['https://a.com/1', 'https://a.com/2']))
        const fetchImages = makeImageFetcher()
        // 第一篇已存在
        collection('news').cursor.toArray.mockResolvedValue([{ article_id: 'x' }])

        await ingestNews({ sources: [needsPageImage], fetchFeed, fetchImages })

        // 兩篇都是新的（回傳的 article_id 'x' 對不上），所以兩篇都補
        expect(fetchImages.mock.calls[0]?.[0] ?? []).toHaveLength(2)
    })

    it('已存在的文章不再補圖', async () => {
        const fetchFeed = vi.fn(async () => makeFeedXml(['https://a.com/1']))
        const fetchImages = makeImageFetcher()
        // 先跑一次拿到實際的 article_id，再假裝它已存在
        await ingestNews({ sources: [needsPageImage], fetchFeed, fetchImages: noImages })
        const existingId =
            collection('news').bulkWrite.mock.calls[0]?.[0][0].updateOne.filter.article_id
        collection('news').cursor.toArray.mockResolvedValue([{ article_id: existingId }])

        const stats = await ingestNews({ sources: [needsPageImage], fetchFeed, fetchImages })

        expect(stats.imagesFetched).toBe(0)
        expect(fetchImages.mock.calls[0]?.[0] ?? []).toHaveLength(0)
    })

    it('feed 已經給了圖的來源完全不補圖', async () => {
        const fetchFeed = vi.fn(async () => makeFeedXml(['https://a.com/1'], true))
        const fetchImages = makeImageFetcher()

        const stats = await ingestNews({ sources: [withImage], fetchFeed, fetchImages })

        expect(stats.imagesFetched).toBe(0)
    })

    it('feed 標為 page 但項目自帶圖時也不補', async () => {
        const fetchFeed = vi.fn(async () => makeFeedXml(['https://a.com/1'], true))
        const fetchImages = makeImageFetcher()

        const stats = await ingestNews({ sources: [needsPageImage], fetchFeed, fetchImages })

        expect(stats.imagesFetched).toBe(0)
    })
})

describe('ingestNews 寫入', () => {
    it('用 upsert 而非刪除重建，既有文章的關聯資料才不會變孤兒', async () => {
        const fetchFeed = vi.fn(async () => makeFeedXml(['https://a.com/1']))

        await ingestNews({ sources: [withImage], fetchFeed, fetchImages: noImages })

        const [operations] = collection('news').bulkWrite.mock.calls[0] ?? []
        expect(operations[0].updateOne.upsert).toBe(true)
        expect(collection('news').deleteMany).not.toHaveBeenCalled()
    })

    it('回報新增與更新的筆數', async () => {
        collection('news').bulkWrite.mockResolvedValue({ upsertedCount: 3, modifiedCount: 2 })
        const fetchFeed = vi.fn(async () => makeFeedXml(['https://a.com/1']))

        const stats = await ingestNews({ sources: [withImage], fetchFeed, fetchImages: noImages })

        expect(stats.inserted).toBe(3)
        expect(stats.updated).toBe(2)
    })
})

describe('buildUpsertOperation', () => {
    const article = {
        item: {
            guid: 'g1',
            title: '標題',
            link: 'https://a.com/1',
            description: '摘要',
            pubDate: '2026-08-06 09:00:00',
            imageUrl: null,
        },
        source: needsPageImage,
        articleId: 'abc',
    }
    const now = new Date('2026-08-06T01:00:00Z')

    it('views 只在建立時給 0，例行更新絕不碰它', () => {
        // 每次抓取都覆寫 views 等於把使用者累積的瀏覽數歸零
        const op = buildUpsertOperation(article, 'https://cdn.example.com/a.jpg', now)
        const update = asUpsert(op).updateOne.update

        expect(update.$setOnInsert.views).toBe(0)
        expect(update.$set).not.toHaveProperty('views')
    })

    it('拿到真圖時更新 image_url', () => {
        const op = buildUpsertOperation(article, 'https://cdn.example.com/a.jpg', now)
        const update = asUpsert(op).updateOne.update

        expect(update.$set.image_url).toBe('https://cdn.example.com/a.jpg')
        expect(update.$setOnInsert).not.toHaveProperty('image_url')
    })

    it('補圖失敗時不覆寫既有圖片，只在建立時放預設圖', () => {
        // 否則某次補圖失敗就會把已經存好的好圖換成預設圖
        const op = buildUpsertOperation(article, null, now)
        const update = asUpsert(op).updateOne.update

        expect(update.$set).not.toHaveProperty('image_url')
        expect(update.$setOnInsert.image_url).toBe(FALLBACK_IMAGE)
    })

    it('image_url 不會同時出現在 $set 與 $setOnInsert——MongoDB 會拒絕衝突路徑', () => {
        for (const ogImage of ['https://cdn.example.com/a.jpg', null]) {
            const op = buildUpsertOperation(article, ogImage, now)
            const update = asUpsert(op).updateOne.update
            const inSet = 'image_url' in update.$set
            const inInsert = 'image_url' in update.$setOnInsert

            expect(inSet && inInsert).toBe(false)
            expect(inSet || inInsert).toBe(true)
        }
    })

    it('以 article_id 為比對條件', () => {
        const op = buildUpsertOperation(article, null, now)
        const filter = asUpsert(op).updateOne.filter

        expect(filter.article_id).toMatch(/^[0-9a-f]{40}$/)
    })

    it('標題與摘要會被更新——原文改標時要跟著改', () => {
        const op = buildUpsertOperation(article, null, now)
        const update = asUpsert(op).updateOne.update

        expect(update.$set.title).toBe('標題')
        expect(update.$set.description).toBe('摘要')
    })
})
