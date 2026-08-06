import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { firstImageSrc, normalizePubDate, parseFeed, stripHtml } from '@/libs/rss/parser'

/** fixture 是 2026-08-06 從各家實際抓下來的，每檔保留前 3 則 */
const fixture = (name: string) =>
    readFileSync(resolve(process.cwd(), 'test/fixtures/rss', `${name}.xml`), 'utf-8')

describe('parseFeed — RSS 2.0', () => {
    it('中央社：取得標題、連結與穩定的 guid', () => {
        const items = parseFeed(fixture('cna-politics'))

        expect(items).toHaveLength(3)
        expect(items[0]).toMatchObject({
            title: '9艘共艦6架次共機擾台　國軍嚴密監控',
            link: 'https://www.cna.com.tw/news/aipl/202608060028.aspx',
            guid: 'CNA/2026-08-06/202608060028',
        })
    })

    it('中央社沒有圖片欄位，imageUrl 為 null 交由上層補 og:image', () => {
        const items = parseFeed(fixture('cna-politics'))

        expect(items[0]?.imageUrl).toBeNull()
    })

    it('不會把 channel 層的 <image>（媒體 logo）誤當成文章圖', () => {
        // 中央社的 channel 有 <image><url>cnalogo...</url></image>
        const items = parseFeed(fixture('cna-politics'))

        expect(items.every((i) => !i.imageUrl?.includes('cnalogo'))).toBe(true)
    })

    it('聯合：從自訂的 <image> 欄位取圖', () => {
        const items = parseFeed(fixture('udn-news'))

        expect(items[0]?.imageUrl).toContain('udn.com')
        expect(items[0]?.guid).toBe('https://udn.com/news/story/6656/9674178')
    })

    it('ETtoday：圖片內嵌在 description 的 <img> 裡', () => {
        const items = parseFeed(fixture('ettoday-realtime'))

        expect(items[0]?.imageUrl).toBe('https://cdn2.ettoday.net/images/8862/c8862875.gif')
    })

    it('ETtoday：摘要會去掉 HTML 標籤，不把 <img> 當文字印出來', () => {
        const items = parseFeed(fixture('ettoday-realtime'))

        expect(items[0]?.description).not.toContain('<img')
        expect(items[0]?.description).not.toContain('src=')
    })

    it('自由時報沒有 guid，回 null 讓上層改用連結產生 id', () => {
        const items = parseFeed(fixture('ltn-all'))

        expect(items[0]?.guid).toBeNull()
        expect(items[0]?.link).toMatch(/^https:\/\/news\.ltn\.com\.tw\//)
    })

    it('新頭殼：從 media:content 取圖', () => {
        const items = parseFeed(fixture('newtalk-all'))

        expect(items[0]?.imageUrl).toContain('images.newtalk.tw')
    })

    it('報導者：從 enclosure 取圖', () => {
        const items = parseFeed(fixture('twreporter'))

        expect(items[0]?.link).toContain('twreporter.org')
        expect(items[0]?.title.length).toBeGreaterThan(0)
    })
})

describe('parseFeed — Atom', () => {
    it('公視：link 取自 rel=alternate 的 href 屬性而非文字內容', () => {
        const items = parseFeed(fixture('pts-atom'))

        expect(items[0]?.link).toBe('https://news.pts.org.tw/article/821079')
    })

    it('公視：id 當作 guid，summary 當作摘要', () => {
        const items = parseFeed(fixture('pts-atom'))

        expect(items[0]?.guid).toBe('https://news.pts.org.tw/article/821079')
        expect(items[0]?.description).toContain('食安')
    })

    it('公視：ISO 8601 的 updated 會被正規化', () => {
        const items = parseFeed(fixture('pts-atom'))

        expect(items[0]?.pubDate).toBe('2026-08-06 09:33:00')
    })
})

describe('parseFeed — 韌性', () => {
    it('不是 RSS 也不是 Atom 時回空陣列，不丟例外', () => {
        expect(parseFeed('<html><body>404</body></html>')).toEqual([])
    })

    it('空字串回空陣列', () => {
        expect(parseFeed('')).toEqual([])
    })

    it('只有一則項目時也回陣列（XML 解析器單筆會回物件）', () => {
        const xml = `<?xml version="1.0"?><rss><channel>
            <item><title>單筆</title><link>https://example.com/a</link></item>
        </channel></rss>`

        expect(parseFeed(xml)).toHaveLength(1)
    })

    it('缺少連結的項目會被丟棄，避免產生無法連回原站的壞資料', () => {
        const xml = `<?xml version="1.0"?><rss><channel>
            <item><title>沒有連結</title></item>
            <item><title>正常</title><link>https://example.com/a</link></item>
        </channel></rss>`

        const items = parseFeed(xml)
        expect(items).toHaveLength(1)
        expect(items[0]?.title).toBe('正常')
    })

    it('缺少標題的項目會被丟棄', () => {
        const xml = `<?xml version="1.0"?><rss><channel>
            <item><link>https://example.com/a</link></item>
        </channel></rss>`

        expect(parseFeed(xml)).toEqual([])
    })
})

describe('normalizePubDate', () => {
    it.each([
        ['標準 RFC 2822', 'Thu, 06 Aug 2026 09:24:57 +0800', '2026-08-06 09:24:57'],
        // ETtoday 實際會產出逗號後少一格、時區前多一格的變體
        ['ETtoday 變體', 'Thu,06 Aug 2026 09:18:00  +0800', '2026-08-06 09:18:00'],
        ['ISO 8601', '2026-08-06T09:33:00+08:00', '2026-08-06 09:33:00'],
    ])('%s', (_label, input, expected) => {
        expect(normalizePubDate(input)).toBe(expected)
    })

    it('GMT 時間會換算成台北時間', () => {
        // 報導者用 GMT，+8 小時後跨到隔天
        expect(normalizePubDate('Sun, 02 Aug 2026 16:00:00 GMT')).toBe('2026-08-03 00:00:00')
    })

    it('輸出格式的字典序等於時間序，字串排序才會正確', () => {
        const early = normalizePubDate('Thu, 06 Aug 2026 09:24:57 +0800')!
        const late = normalizePubDate('Thu, 06 Aug 2026 11:09:55 +0800')!
        const nextDay = normalizePubDate('Fri, 07 Aug 2026 01:00:00 +0800')!

        expect([nextDay, early, late].sort()).toEqual([early, late, nextDay])
    })

    it.each([[null], [''], ['not a date']])('無法解析時回 null（%s）', (input) => {
        expect(normalizePubDate(input)).toBeNull()
    })
})

describe('stripHtml', () => {
    it('移除標籤但保留文字', () => {
        expect(stripHtml('<p>你好<br />世界</p>')).toBe('你好 世界')
    })

    it('還原 HTML 實體', () => {
        expect(stripHtml('a &lt; b &amp;&amp; c &quot;d&quot;')).toBe('a < b && c "d"')
    })

    it('&amp; 最後處理，不會把還原出來的實體再解一次', () => {
        // &amp;lt; 應該還原成字面的 "&lt;"，而不是繼續解成 "<"
        expect(stripHtml('&amp;lt;')).toBe('&lt;')
    })

    it('壓縮多餘的半形空白', () => {
        expect(stripHtml('  a\n\n  b  ')).toBe('a b')
    })

    it('保留全形空格，那是中文標題的分隔符不是多餘空白', () => {
        expect(stripHtml('9艘共艦擾台　國軍嚴密監控')).toBe('9艘共艦擾台　國軍嚴密監控')
    })
})

describe('firstImageSrc', () => {
    it('取出第一張圖的網址', () => {
        expect(
            firstImageSrc('<img src="https://a.com/1.jpg"><img src="https://a.com/2.jpg">')
        ).toBe('https://a.com/1.jpg')
    })

    it('沒有圖片時回 null', () => {
        expect(firstImageSrc('純文字')).toBeNull()
    })
})
