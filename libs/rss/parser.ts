import { XMLParser } from 'fast-xml-parser'

/**
 * 把各家 RSS 2.0 / Atom 的歧異收斂成同一種形狀。
 * 上層（toNewsDocument、ingestion）只認識 FeedItem，不必知道來源是哪種格式。
 */
export interface FeedItem {
    /** 來源提供的穩定識別碼；自由時報沒有，會是 null */
    guid: string | null
    title: string
    link: string
    /** 已去除 HTML 標籤的純文字摘要 */
    description: string
    /** 正規化為 'YYYY-MM-DD HH:mm:ss'（台北時間）；解析失敗為 null */
    pubDate: string | null
    /** feed 或摘要裡就能取得的圖片；沒有則為 null，由上層決定要不要抓 og:image */
    imageUrl: string | null
}

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true,
    processEntities: true,
})

/** fast-xml-parser 只有單一節點時回物件、多個時回陣列，統一成陣列處理 */
function toArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined || value === null) return []
    return Array.isArray(value) ? value : [value]
}

/**
 * 取節點的文字內容。
 * 節點若帶屬性（例如 <guid isPermaLink="false">），內容會被放進 '#text'。
 */
function text(node: unknown): string | null {
    if (node === undefined || node === null) return null
    if (typeof node === 'string') return node.trim() || null
    if (typeof node === 'number') return String(node)
    if (typeof node === 'object' && '#text' in node) {
        const value = (node as Record<string, unknown>)['#text']
        return value === undefined || value === null ? null : String(value).trim() || null
    }
    return null
}

function attr(node: unknown, name: string): string | null {
    if (typeof node !== 'object' || node === null) return null
    const value = (node as Record<string, unknown>)[`@_${name}`]
    return value === undefined || value === null ? null : String(value).trim() || null
}

/**
 * 把 HTML 摘要轉成純文字。
 *
 * 摘要會直接顯示在卡片與詳情頁上，留著標籤會被當成字面文字印出來。
 * 這裡不追求完整的 HTML 解析——來源是各家自己產的摘要，結構單純。
 */
export function stripHtml(html: string): string {
    return (
        html
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            // &amp; 要最後處理，否則會把上面還原出來的實體再解一次
            .replace(/&amp;/g, '&')
            // 只壓半形空白。JS 的 \s 涵蓋全形空格 U+3000，而中文新聞標題常拿它
            // 當分隔符（「9艘共艦擾台　國軍嚴密監控」），壓成半形會改變原標題。
            .replace(/[ \t\n\r\f\v]+/g, ' ')
            .trim()
    )
}

/** 從 HTML 片段裡撈第一張圖，ETtoday 的圖片就藏在 description 裡 */
export function firstImageSrc(html: string): string | null {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
    return match?.[1] ?? null
}

/**
 * 各家的 pubDate 格式不一致：CNA/LTN/UDN 是標準 RFC 2822、報導者用 GMT、
 * 公視是 ISO 8601，而 ETtoday 會產出 'Thu,06 Aug 2026 09:18:00  +0800'
 * 這種逗號後少一格、時區前多一格的變體。先把空白正規化再交給 Date 解析。
 *
 * 輸出固定為台北時間的 'YYYY-MM-DD HH:mm:ss'：
 * 資料庫的 pubDate 是字串欄位且用 { pubDate: -1 } 排序，
 * 只有這種零填補的格式才能讓字典序等於時間序。
 */
export function normalizePubDate(raw: string | null): string | null {
    if (!raw) return null

    const cleaned = raw
        .replace(/,(?=\S)/, ', ')
        .replace(/\s+/g, ' ')
        .trim()
    const date = new Date(cleaned)
    if (Number.isNaN(date.getTime())) return null

    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(date)

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
    // en-CA 的日期部分已經是 YYYY-MM-DD，但時間部分仍要自己組，
    // 而且 hour 在午夜可能給 '24'，統一用 formatToParts 取值後自行拼接
    const hour = get('hour') === '24' ? '00' : get('hour')

    return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`
}

/** 從 RSS item 的各種可能欄位裡找圖片 */
function extractRssImage(item: Record<string, unknown>, rawDescription: string): string | null {
    // enclosure（報導者）：只認 image/* 或沒標型別的
    for (const enclosure of toArray(item.enclosure)) {
        const type = attr(enclosure, 'type')
        const url = attr(enclosure, 'url')
        if (url && (!type || type.startsWith('image/'))) return url
    }

    // media:content / media:thumbnail（新頭殼）
    for (const key of ['media:content', 'media:thumbnail']) {
        for (const media of toArray(item[key])) {
            const url = attr(media, 'url')
            if (url) return url
        }
    }

    // <image>（聯合自訂欄位，內容是純 URL）
    const image = text(item.image)
    if (image?.startsWith('http')) return image

    // 內嵌在摘要裡的 <img>（ETtoday）
    return firstImageSrc(rawDescription)
}

function parseRssItem(item: Record<string, unknown>): FeedItem | null {
    const title = text(item.title)
    const link = text(item.link)
    if (!title || !link) return null

    const rawDescription = text(item.description) ?? ''

    return {
        guid: text(item.guid),
        title: stripHtml(title),
        link,
        description: stripHtml(rawDescription),
        pubDate: normalizePubDate(text(item.pubDate) ?? text(item['dc:date'])),
        imageUrl: extractRssImage(item, rawDescription),
    }
}

function parseAtomEntry(entry: Record<string, unknown>): FeedItem | null {
    const title = text(entry.title)
    if (!title) return null

    // Atom 的 link 是屬性而非文字內容，且可能有多個 rel
    const links = toArray(entry.link)
    const link =
        links
            .map((l) => (attr(l, 'rel') ?? 'alternate') === 'alternate' && attr(l, 'href'))
            .find((href): href is string => Boolean(href)) ?? null
    if (!link) return null

    const rawSummary = text(entry.summary) ?? text(entry.content) ?? ''

    return {
        guid: text(entry.id),
        title: stripHtml(title),
        link,
        description: stripHtml(rawSummary),
        pubDate: normalizePubDate(text(entry.updated) ?? text(entry.published)),
        imageUrl: firstImageSrc(rawSummary),
    }
}

/**
 * 解析 RSS 2.0 或 Atom 的 XML 字串。
 *
 * 缺少標題或連結的項目會被丟棄——沒有連結就無法連回原站，
 * 也無法產生穩定的 article_id，留著只會變成壞資料。
 */
export function parseFeed(xml: string): FeedItem[] {
    const parsed = parser.parse(xml) as Record<string, unknown>

    const rss = parsed.rss as Record<string, unknown> | undefined
    const channel = rss?.channel as Record<string, unknown> | undefined
    if (channel) {
        return toArray(channel.item as Record<string, unknown>[])
            .map(parseRssItem)
            .filter((item): item is FeedItem => item !== null)
    }

    const feed = parsed.feed as Record<string, unknown> | undefined
    if (feed) {
        return toArray(feed.entry as Record<string, unknown>[])
            .map(parseAtomEntry)
            .filter((item): item is FeedItem => item !== null)
    }

    return []
}
