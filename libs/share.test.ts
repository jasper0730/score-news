import { afterEach, describe, expect, it, vi } from 'vitest'
import { shareArticle } from '@/libs/share'

const ARTICLE = {
    title: '颱風來襲',
    description: '中央氣象署發布陸上颱風警報',
    link: 'https://www.cna.com.tw/news/aipl/1.aspx',
    source_url: 'https://www.cna.com.tw',
}

/** navigator 在 node 環境下不可寫，用 stubGlobal 換掉整個物件 */
function stubNavigator(overrides: Record<string, unknown>) {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn() }, ...overrides })
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('shareArticle — 原生分享面板', () => {
    it('有 Web Share API 時優先使用', async () => {
        const share = vi.fn(async () => {})
        stubNavigator({ share })

        expect(await shareArticle(ARTICLE)).toBe('shared')
        expect(share).toHaveBeenCalledWith({
            title: '颱風來襲',
            text: '中央氣象署發布陸上颱風警報',
            url: ARTICLE.link,
        })
    })

    it('使用者取消時回 cancelled，不退回去複製連結', async () => {
        // 按取消是明確表示不想分享，這時候還偷偷複製到剪貼簿很沒禮貌
        const writeText = vi.fn()
        stubNavigator({
            share: vi.fn(async () => {
                throw new DOMException('aborted', 'AbortError')
            }),
            clipboard: { writeText },
        })

        expect(await shareArticle(ARTICLE)).toBe('cancelled')
        expect(writeText).not.toHaveBeenCalled()
    })

    it('原生分享因其他原因失敗時退回複製連結', async () => {
        const writeText = vi.fn(async () => {})
        stubNavigator({
            share: vi.fn(async () => {
                throw new Error('NotAllowedError')
            }),
            clipboard: { writeText },
        })

        expect(await shareArticle(ARTICLE)).toBe('copied')
        expect(writeText).toHaveBeenCalledWith(ARTICLE.link)
    })
})

describe('shareArticle — 複製連結', () => {
    it('沒有 Web Share API 時複製到剪貼簿', async () => {
        const writeText = vi.fn(async () => {})
        stubNavigator({ clipboard: { writeText } })

        expect(await shareArticle(ARTICLE)).toBe('copied')
        expect(writeText).toHaveBeenCalledWith(ARTICLE.link)
    })

    it('剪貼簿也失敗時回 failed', async () => {
        stubNavigator({
            clipboard: {
                writeText: vi.fn(async () => {
                    throw new Error('denied')
                }),
            },
        })

        expect(await shareArticle(ARTICLE)).toBe('failed')
    })
})

describe('shareArticle — 分享的網址', () => {
    it('優先分享原文連結', async () => {
        const writeText = vi.fn(async () => {})
        stubNavigator({ clipboard: { writeText } })

        await shareArticle(ARTICLE)

        expect(writeText).toHaveBeenCalledWith(ARTICLE.link)
    })

    it('沒有原文連結時退回媒體首頁', async () => {
        const writeText = vi.fn(async () => {})
        stubNavigator({ clipboard: { writeText } })

        await shareArticle({ ...ARTICLE, link: undefined })

        expect(writeText).toHaveBeenCalledWith(ARTICLE.source_url)
    })

    it('兩個網址都沒有時回 failed，不會分享出空連結', async () => {
        const writeText = vi.fn()
        stubNavigator({ clipboard: { writeText } })

        expect(await shareArticle({ title: '無連結' })).toBe('failed')
        expect(writeText).not.toHaveBeenCalled()
    })
})
