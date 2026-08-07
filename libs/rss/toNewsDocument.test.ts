import { describe, expect, it } from 'vitest'
import type { FeedItem } from '@/libs/rss/parser'
import type { FeedSource } from '@/libs/rss/sources'
import {
    absoluteUrl,
    buildArticleId,
    extractLinkId,
    FALLBACK_IMAGE,
    toNewsDocument,
} from '@/libs/rss/toNewsDocument'

const SOURCE: FeedSource = {
    outlet: 'cna',
    outletName: '中央社',
    siteUrl: 'https://www.cna.com.tw',
    iconUrl: 'https://www.cna.com.tw/favicon.ico',
    category: '政治',
    url: 'https://feeds.feedburner.com/rsscna/politics',
    imageSource: 'page',
}

function makeItem(overrides: Partial<FeedItem> = {}): FeedItem {
    return {
        guid: 'CNA/2026-08-06/202608060028',
        title: '9艘共艦6架次共機擾台',
        link: 'https://www.cna.com.tw/news/aipl/202608060028.aspx',
        description: '國防部今天發布共機艦動態',
        pubDate: '2026-08-06 09:24:57',
        imageUrl: null,
        ...overrides,
    }
}

const CNA = { outlet: 'cna' }
const LTN = { outlet: 'ltn', linkIdPattern: /\/(\d+)\/?(?:[?#]|$)/ }

describe('buildArticleId', () => {
    it('同一篇文章重複產生會得到相同的 id', () => {
        // 這個值是評分、留言、收藏唯一的關聯鍵，變動等於使用者資料變孤兒
        const item = makeItem()

        expect(buildArticleId(CNA, item)).toBe(buildArticleId(CNA, item))
    })

    it('不同文章得到不同的 id', () => {
        const a = buildArticleId(CNA, makeItem({ guid: 'CNA/1' }))
        const b = buildArticleId(CNA, makeItem({ guid: 'CNA/2' }))

        expect(a).not.toBe(b)
    })

    it('不同媒體即使 guid 相同也不會撞號', () => {
        const item = makeItem({ guid: '12345' })

        expect(buildArticleId(CNA, item)).not.toBe(buildArticleId({ outlet: 'ltn' }, item))
    })

    it('沒有 guid 也沒有萃取規則時改用連結，結果一樣穩定', () => {
        const item = makeItem({ guid: null })

        expect(buildArticleId({ outlet: 'x' }, item)).toBe(buildArticleId({ outlet: 'x' }, item))
    })

    it('沒有 guid 也沒有萃取規則時，連結不同就是不同文章', () => {
        const a = buildArticleId({ outlet: 'x' }, makeItem({ guid: null, link: 'https://a.com/1' }))
        const b = buildArticleId({ outlet: 'x' }, makeItem({ guid: null, link: 'https://a.com/2' }))

        expect(a).not.toBe(b)
    })

    it('id 不受標題或摘要變動影響——原文改標時不該變成新文章', () => {
        const before = buildArticleId(CNA, makeItem({ title: '原標題' }))
        const after = buildArticleId(CNA, makeItem({ title: '改過的標題' }))

        expect(before).toBe(after)
    })

    it('產生十六進位字串，可安全用於 URL 與資料庫索引', () => {
        expect(buildArticleId(CNA, makeItem())).toMatch(/^[0-9a-f]{40}$/)
    })

    describe('從連結萃取識別碼（自由時報）', () => {
        it('同一篇掛在不同分類路徑下會得到同一個 id', () => {
            // 這是實際造成 4% 重複率的情況
            const a = buildArticleId(
                LTN,
                makeItem({
                    guid: null,
                    link: 'https://news.ltn.com.tw/news/politics/breakingnews/5530552',
                })
            )
            const b = buildArticleId(
                LTN,
                makeItem({
                    guid: null,
                    link: 'https://news.ltn.com.tw/news/Tainan/breakingnews/5530552',
                })
            )

            expect(a).toBe(b)
        })

        it('不同子網域但同一篇文章編號也視為同一篇', () => {
            const a = buildArticleId(
                LTN,
                makeItem({
                    guid: null,
                    link: 'https://news.ltn.com.tw/news/life/breakingnews/5530299',
                })
            )
            const b = buildArticleId(
                LTN,
                makeItem({
                    guid: null,
                    link: 'https://health.ltn.com.tw/article/breakingnews/5530299',
                })
            )

            expect(a).toBe(b)
        })

        it('不同文章編號仍是不同文章', () => {
            const a = buildArticleId(LTN, makeItem({ guid: null, link: 'https://a.com/x/1111' }))
            const b = buildArticleId(LTN, makeItem({ guid: null, link: 'https://a.com/x/2222' }))

            expect(a).not.toBe(b)
        })

        it('連結帶 query 或 hash 時仍取得到編號', () => {
            const base = buildArticleId(
                LTN,
                makeItem({ guid: null, link: 'https://a.com/x/5530552' })
            )

            expect(
                buildArticleId(
                    LTN,
                    makeItem({ guid: null, link: 'https://a.com/x/5530552?utm=fb' })
                )
            ).toBe(base)
            expect(
                buildArticleId(LTN, makeItem({ guid: null, link: 'https://a.com/x/5530552#top' }))
            ).toBe(base)
        })

        it('有 guid 時仍以 guid 優先，不受萃取規則影響', () => {
            const withGuid = makeItem({ guid: 'G1', link: 'https://a.com/x/1111' })
            const sameGuidOtherLink = makeItem({ guid: 'G1', link: 'https://a.com/y/2222' })

            expect(buildArticleId(LTN, withGuid)).toBe(buildArticleId(LTN, sameGuidOtherLink))
        })

        it('連結不含數字時退回用完整連結，不會拋錯', () => {
            const item = makeItem({ guid: null, link: 'https://a.com/about' })

            expect(buildArticleId(LTN, item)).toBe(buildArticleId(LTN, item))
            expect(buildArticleId(LTN, item)).toMatch(/^[0-9a-f]{40}$/)
        })
    })
})

describe('extractLinkId', () => {
    it('沒有給樣式時回 null', () => {
        expect(extractLinkId('https://a.com/x/123')).toBeNull()
    })

    it('取出第一個捕捉群組', () => {
        expect(extractLinkId('https://a.com/x/5530552', /\/(\d+)\/?(?:[?#]|$)/)).toBe('5530552')
    })

    it('對不上時回 null', () => {
        expect(extractLinkId('https://a.com/about', /\/(\d+)\/?(?:[?#]|$)/)).toBeNull()
    })
})

describe('absoluteUrl', () => {
    it('相對路徑補成絕對網址', () => {
        expect(absoluteUrl('/img/a.jpg', 'https://www.cna.com.tw')).toBe(
            'https://www.cna.com.tw/img/a.jpg'
        )
    })

    it('已是絕對網址則原樣保留', () => {
        expect(absoluteUrl('https://cdn.example.com/a.jpg', 'https://a.com')).toBe(
            'https://cdn.example.com/a.jpg'
        )
    })

    it('修掉新頭殼實際會產出的重複協定前綴', () => {
        // 'http:https://images.newtalk.tw/...' 直接丟給 URL 會得到永遠載不到的網址
        expect(absoluteUrl('http:https://images.newtalk.tw/a.jpg', 'https://newtalk.tw')).toBe(
            'https://images.newtalk.tw/a.jpg'
        )
    })

    it('null 與無法解析的值都回 null', () => {
        expect(absoluteUrl(null, 'https://a.com')).toBeNull()
        expect(absoluteUrl('http://[bad', 'https://a.com')).toBeNull()
    })
})

describe('toNewsDocument', () => {
    it('組出可寫入資料庫的文件', () => {
        const doc = toNewsDocument(makeItem(), SOURCE)

        expect(doc).toMatchObject({
            title: '9艘共艦6架次共機擾台',
            description: '國防部今天發布共機艦動態',
            link: 'https://www.cna.com.tw/news/aipl/202608060028.aspx',
            pubDate: '2026-08-06 09:24:57',
            source_name: '中央社',
            source_url: 'https://www.cna.com.tw',
            category: '政治',
            outlet: 'cna',
        })
    })

    it('content 保持空字串——只存摘要並連回原站，不抓全文', () => {
        const doc = toNewsDocument(makeItem(), SOURCE)

        // 前端在 content 為空時會顯示 description 並附上「閱讀完整原文」連結
        expect(doc.content).toBe('')
        expect(doc.link).toBeTruthy()
    })

    it('只輸出白名單欄位，不把來源的多餘欄位一起存進資料庫', () => {
        const doc = toNewsDocument(makeItem({ guid: 'x' } as Partial<FeedItem>), SOURCE)

        expect(Object.keys(doc).sort()).toEqual(
            [
                'article_id',
                'category',
                'content',
                'description',
                'fetchedAt',
                'image_url',
                'link',
                'outlet',
                'pubDate',
                'source_icon',
                'source_name',
                'source_url',
                'title',
            ].sort()
        )
        expect(doc).not.toHaveProperty('guid')
    })

    describe('圖片來源的優先順序', () => {
        it('優先用 feed 自帶的圖', () => {
            const doc = toNewsDocument(
                makeItem({ imageUrl: 'https://cdn.example.com/feed.jpg' }),
                SOURCE,
                { ogImage: 'https://cdn.example.com/og.jpg' }
            )

            expect(doc.image_url).toBe('https://cdn.example.com/feed.jpg')
        })

        it('feed 沒有圖時退回 og:image', () => {
            const doc = toNewsDocument(makeItem({ imageUrl: null }), SOURCE, {
                ogImage: 'https://cdn.example.com/og.jpg',
            })

            expect(doc.image_url).toBe('https://cdn.example.com/og.jpg')
        })

        it('兩者都沒有時用預設圖，不讓 image_url 變成空字串', () => {
            const doc = toNewsDocument(makeItem({ imageUrl: null }), SOURCE)

            expect(doc.image_url).toBe(FALLBACK_IMAGE)
        })

        it('相對路徑的圖會補成絕對網址', () => {
            const doc = toNewsDocument(makeItem({ imageUrl: '/img/a.jpg' }), SOURCE)

            expect(doc.image_url).toBe('https://www.cna.com.tw/img/a.jpg')
        })
    })

    describe('缺少日期時', () => {
        it('退回使用抓取時間，格式與正常情況一致', () => {
            const now = new Date('2026-08-06T01:24:57Z') // 台北時間 09:24:57
            const doc = toNewsDocument(makeItem({ pubDate: null }), SOURCE, { now })

            expect(doc.pubDate).toBe('2026-08-06 09:24:57')
        })

        it('不會留下空字串，否則排序會把它排到最前面', () => {
            const doc = toNewsDocument(makeItem({ pubDate: null }), SOURCE)

            expect(doc.pubDate).not.toBe('')
            expect(doc.pubDate).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
        })
    })
})
