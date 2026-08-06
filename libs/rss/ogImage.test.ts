import { afterEach, describe, expect, it, vi } from 'vitest'
import { extractOgImage, fetchOgImage, fetchOgImages } from '@/libs/rss/ogImage'

const html = (head: string) => `<!DOCTYPE html><html><head>${head}</head><body>內文</body></html>`

/**
 * body 給 null 讓 fetchOgImage 走 text() 這條路。
 * 串流讀取那條已由實際連線驗證過（中央社、自由時報、公視都取得到 og:image），
 * 在 jsdom 之外重建一個 ReadableStream 只是徒增複雜度。
 */
function mockFetch(options: { body?: string; ok?: boolean; contentType?: string } = {}) {
    const { body = '', ok = true, contentType = 'text/html; charset=utf-8' } = options
    vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
            ok,
            status: ok ? 200 : 404,
            headers: new Headers({ 'content-type': contentType }),
            body: null,
            text: async () => body,
        }))
    )
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('extractOgImage', () => {
    it('取出 og:image', () => {
        const result = extractOgImage(
            html('<meta property="og:image" content="https://cdn.example.com/a.jpg">')
        )

        expect(result).toBe('https://cdn.example.com/a.jpg')
    })

    it('屬性順序相反時也能取出', () => {
        const result = extractOgImage(
            html('<meta content="https://cdn.example.com/a.jpg" property="og:image">')
        )

        expect(result).toBe('https://cdn.example.com/a.jpg')
    })

    it('沒有 og:image 時退回 twitter:image', () => {
        const result = extractOgImage(
            html('<meta name="twitter:image" content="https://cdn.example.com/t.jpg">')
        )

        expect(result).toBe('https://cdn.example.com/t.jpg')
    })

    it('og:image 優先於 twitter:image', () => {
        const result = extractOgImage(
            html(
                '<meta name="twitter:image" content="https://cdn.example.com/t.jpg">' +
                    '<meta property="og:image" content="https://cdn.example.com/og.jpg">'
            )
        )

        expect(result).toBe('https://cdn.example.com/og.jpg')
    })

    it('單引號的寫法同樣支援', () => {
        expect(
            extractOgImage(html("<meta property='og:image' content='https://a.com/x.jpg'>"))
        ).toBe('https://a.com/x.jpg')
    })

    it('都沒有時回 null', () => {
        expect(extractOgImage(html('<title>沒有圖</title>'))).toBeNull()
    })

    it('content 是空字串時視為沒有', () => {
        expect(extractOgImage(html('<meta property="og:image" content="">'))).toBeNull()
    })
})

describe('fetchOgImage', () => {
    it('取得文章頁的 og:image', async () => {
        mockFetch({ body: html('<meta property="og:image" content="https://a.com/x.jpg">') })

        expect(await fetchOgImage('https://news.example.com/1')).toBe('https://a.com/x.jpg')
    })

    it('帶上 User-Agent，讓對方站台知道是誰在抓', async () => {
        mockFetch({ body: html('') })

        await fetchOgImage('https://news.example.com/1')

        const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] ?? []
        expect(init.headers['User-Agent']).toContain('ScoreNewsBot')
    })

    describe('補圖是錦上添花，任何失敗都只回 null 不中斷整批 ingestion', () => {
        it('HTTP 錯誤', async () => {
            mockFetch({ ok: false })

            expect(await fetchOgImage('https://news.example.com/1')).toBeNull()
        })

        it('回傳的不是 HTML', async () => {
            mockFetch({
                contentType: 'application/pdf',
                body: html('<meta property="og:image" content="https://a.com/x.jpg">'),
            })

            expect(await fetchOgImage('https://news.example.com/1')).toBeNull()
        })

        it('連線丟出例外', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(async () => {
                    throw new Error('ECONNRESET')
                })
            )

            expect(await fetchOgImage('https://news.example.com/1')).toBeNull()
        })

        it('逾時', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(async (_url: string, init: RequestInit) => {
                    return new Promise((_resolve, reject) => {
                        init.signal?.addEventListener('abort', () =>
                            reject(new DOMException('aborted', 'AbortError'))
                        )
                    })
                })
            )

            expect(await fetchOgImage('https://news.example.com/1', 10)).toBeNull()
        })
    })
})

describe('fetchOgImages', () => {
    it('批次取得，回傳 link 對圖片的 map', async () => {
        const fetcher = vi.fn(async (url: string) => `${url}/image.jpg`)

        const result = await fetchOgImages(['https://a.com/1', 'https://a.com/2'], 5, fetcher)

        expect(result.get('https://a.com/1')).toBe('https://a.com/1/image.jpg')
        expect(result.size).toBe(2)
    })

    it('取不到的網址不會出現在結果裡', async () => {
        const fetcher = vi.fn(async (url: string) => (url.endsWith('1') ? 'https://img' : null))

        const result = await fetchOgImages(['https://a.com/1', 'https://a.com/2'], 5, fetcher)

        expect(result.size).toBe(1)
        expect(result.has('https://a.com/2')).toBe(false)
    })

    it('重複的網址只抓一次', async () => {
        const fetcher = vi.fn(async () => 'https://img')

        await fetchOgImages(['https://a.com/1', 'https://a.com/1'], 5, fetcher)

        expect(fetcher).toHaveBeenCalledOnce()
    })

    it('併發數受限，不會同時對站台送出所有請求', async () => {
        let running = 0
        let peak = 0
        const fetcher = vi.fn(async () => {
            running++
            peak = Math.max(peak, running)
            await new Promise((r) => setTimeout(r, 5))
            running--
            return 'https://img'
        })

        await fetchOgImages(
            Array.from({ length: 12 }, (_, i) => `https://a.com/${i}`),
            3,
            fetcher
        )

        expect(peak).toBeLessThanOrEqual(3)
    })

    it('空清單直接回空 map，不會卡住', async () => {
        expect((await fetchOgImages([], 5, vi.fn())).size).toBe(0)
    })
})
