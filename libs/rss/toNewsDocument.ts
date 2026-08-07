import { createHash } from 'crypto'
import type { NewsDocument } from '@/libs/db'
import type { FeedSource } from '@/libs/rss/sources'
import type { FeedItem } from '@/libs/rss/parser'

/** feed 沒有圖、也抓不到 og:image 時的替代圖 */
export const FALLBACK_IMAGE = '/images/no-image.jpg'

/**
 * 產生穩定的 article_id。
 *
 * 這個值是 ratings / comments / favorites 唯一的關聯鍵，
 * 同一篇文章不論抓幾次都必須得到同一個 id——變動就等於使用者的評分與留言
 * 全部變成孤兒資料。因此只能由「來源 + 該來源的穩定識別碼」決定，
 * 不可摻入時間、亂數或抓取順序。
 *
 * 種子的優先順序：
 * 1. feed 的 guid
 * 2. 從連結萃取的識別碼（`linkIdPattern`）
 * 3. 完整連結
 *
 * 第 2 層是為了自由時報：它沒有 guid，而且同一篇文章會掛在多個分類路徑下，
 * 用完整連結會把同一篇算成兩篇。
 *
 * 刻意收整個 source 而非只收 outlet 字串——少傳一個參數就會悄悄退回
 * 用完整連結，重新製造出重複文章，而且不會有任何錯誤訊息。
 */
export function buildArticleId(
    source: Pick<FeedSource, 'outlet' | 'linkIdPattern'>,
    item: Pick<FeedItem, 'guid' | 'link'>
): string {
    const seed = item.guid ?? extractLinkId(item.link, source.linkIdPattern) ?? item.link
    return createHash('sha1').update(`${source.outlet}:${seed}`).digest('hex')
}

/** 樣式的第一個捕捉群組就是識別碼；對不上時回 null 讓上層退回用完整連結 */
export function extractLinkId(link: string, pattern?: RegExp): string | null {
    if (!pattern) return null
    return link.match(pattern)?.[1] ?? null
}

/**
 * 相對路徑或 protocol-relative 的圖片網址補成絕對網址，否則 next/image 會拒絕。
 *
 * 另外修掉新頭殼實際會產出的 'http:https://images.newtalk.tw/...'——
 * 多了一段假協定，直接丟給 URL 會解析成 protocol=http、pathname=https://...，
 * 得到一個永遠載不到的網址。
 */
export function absoluteUrl(url: string | null, base: string): string | null {
    if (!url) return null
    const cleaned = url.replace(/^https?:(?=https?:\/\/)/, '')
    try {
        return new URL(cleaned, base).toString()
    } catch {
        return null
    }
}

export interface ToNewsDocumentOptions {
    /** 額外抓到的 og:image，優先度低於 feed 自帶的圖 */
    ogImage?: string | null
    /** 測試可注入固定時間；預設為現在 */
    now?: Date
}

/**
 * FeedItem + 來源設定 → 可寫入資料庫的 NewsDocument。
 *
 * 刻意逐欄組裝而非展開 FeedItem：欄位對不上時會在這裡編譯失敗，
 * 也擋住來源的多餘欄位被一起存進資料庫。
 */
export function toNewsDocument(
    item: FeedItem,
    source: FeedSource,
    options: ToNewsDocumentOptions = {}
): NewsDocument & { category: string; outlet: string; fetchedAt: Date } {
    const { ogImage = null, now = new Date() } = options

    const image =
        absoluteUrl(item.imageUrl, source.siteUrl) ?? absoluteUrl(ogImage, source.siteUrl) ?? ''

    return {
        article_id: buildArticleId(source, item),
        title: item.title,
        description: item.description,
        // 只存摘要並連回原站，不抓全文。前端在 content 為空時
        // 會顯示 description 並附上「閱讀完整原文」連結。
        content: '',
        link: item.link,
        image_url: image || FALLBACK_IMAGE,
        // 來源沒給日期時用抓取時間，總比讓排序拿到空字串好
        pubDate: item.pubDate ?? formatNow(now),
        source_icon: source.iconUrl,
        source_name: source.outletName,
        source_url: source.siteUrl,
        category: source.category,
        outlet: source.outlet,
        fetchedAt: now,
    }
}

/** 與 normalizePubDate 相同的輸出格式，供缺日期時退回使用 */
function formatNow(now: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(now)
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
    const hour = get('hour') === '24' ? '00' : get('hour')
    return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`
}
