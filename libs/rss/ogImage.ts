/**
 * 從文章頁的 OpenGraph meta 取得代表圖。
 *
 * 中央社、自由時報、公視的 RSS 沒有圖片欄位，只能回頭抓文章頁。
 * 實測（2026-08-06）成功率 20/21。
 */

const USER_AGENT =
    'Mozilla/5.0 (compatible; ScoreNewsBot/0.1; +https://github.com/jasper0730/score-news)'

/**
 * 只讀前 64KB 就停。
 *
 * og:image 一定在 <head> 裡，而新聞頁動輒數百 KB——為了一個 meta 標籤
 * 把整頁拉完，685 篇就是上百 MB 的無謂流量。
 */
const MAX_BYTES = 64 * 1024
const TIMEOUT_MS = 10000

/** 從 HTML 片段抓 og:image，退而求其次用 twitter:image */
export function extractOgImage(html: string): string | null {
    const patterns = [
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
        // 屬性順序相反的寫法同樣常見
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
        /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ]

    for (const pattern of patterns) {
        const match = html.match(pattern)
        const url = match?.[1]?.trim()
        if (url) return url
    }
    return null
}

/**
 * 串流讀取，讀到 </head> 或 64KB 就中止連線。
 * 找不到 head 結尾也不要緊，前 64KB 已經足夠涵蓋 meta 區塊。
 */
async function readHead(response: Response): Promise<string> {
    if (!response.body) return await response.text()

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let html = ''

    try {
        while (html.length < MAX_BYTES) {
            const { done, value } = await reader.read()
            if (done) break
            html += decoder.decode(value, { stream: true })
            if (html.includes('</head>')) break
        }
    } finally {
        // 提早結束時要主動取消，否則連線會一直掛著
        await reader.cancel().catch(() => {})
    }

    return html
}

/**
 * 抓取單篇文章的 og:image。
 *
 * 補圖是錦上添花，失敗一律回 null 讓上層退回預設圖——
 * 不該因為某個站台慢或改版就讓整批 ingestion 失敗。
 */
export async function fetchOgImage(url: string, timeoutMs = TIMEOUT_MS): Promise<string | null> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
            signal: controller.signal,
            redirect: 'follow',
        })
        if (!response.ok) return null

        const contentType = response.headers.get('content-type') ?? ''
        if (!contentType.includes('html')) return null

        return extractOgImage(await readHead(response))
    } catch {
        return null
    } finally {
        clearTimeout(timer)
    }
}

/**
 * 批次補圖，限制併發避免對單一站台送出大量請求。
 * 回傳 link → 圖片網址的對應，取不到的 link 不會出現在結果裡。
 */
export async function fetchOgImages(
    urls: string[],
    concurrency = 5,
    fetcher: (url: string) => Promise<string | null> = fetchOgImage
): Promise<Map<string, string>> {
    const result = new Map<string, string>()
    const queue = [...new Set(urls)]
    let cursor = 0

    await Promise.all(
        Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
            while (cursor < queue.length) {
                const url = queue[cursor++]!
                const image = await fetcher(url)
                if (image) result.set(url, image)
            }
        })
    )

    return result
}
