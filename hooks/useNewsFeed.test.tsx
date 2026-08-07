import { act, render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNewsStore } from '@/store/newsStore'
import type { NewsDataType } from '@/types/news'
import type { NewsResponse } from '@/actions/newsActions'

const getNewsActions = vi.hoisted(() => vi.fn())
const toggleFavoriteAction = vi.hoisted(() => vi.fn())
const rateNewsAction = vi.hoisted(() => vi.fn())
const incrementViewAction = vi.hoisted(() => vi.fn())
const toastBox = vi.hoisted(() => vi.fn())

vi.mock('@/actions/newsActions', () => ({ getNewsActions }))
vi.mock('@/actions/favoriteActions', () => ({ toggleFavoriteAction }))
vi.mock('@/actions/rateNewsAction', () => ({ rateNewsAction }))
vi.mock('@/actions/viewActions', () => ({ incrementViewAction }))
vi.mock('@/utils/toast', () => ({ toastBox }))

const { useNewsFeed } = await import('@/hooks/useNewsFeed')

type Feed = ReturnType<typeof useNewsFeed>

/**
 * 用真的元件掛載 hook，而不是 renderHook。
 *
 * 無限捲動的 loadMore 沒有對外回傳，只能透過 IntersectionObserver 觸發，
 * 而 observer 的 effect 需要 sentinelRef 真的指到一個 DOM 元素才會建立。
 */
let feed: Feed
function Harness({ initial }: { initial: NewsResponse }) {
    feed = useNewsFeed(initial)
    return <div ref={feed.sentinelRef} data-testid="sentinel" />
}

function renderFeed(initial: NewsResponse) {
    render(<Harness initial={initial} />)
    return {
        get current() {
            return feed
        },
    }
}

/** setup.client.ts 換掉的 IntersectionObserver 替身 */
type ObserverStub = { trigger(isIntersecting?: boolean): void }
const observers = () =>
    (globalThis.IntersectionObserver as unknown as { instances: ObserverStub[] }).instances

/** 模擬使用者捲到列表底部 */
async function scrollToBottom() {
    const observer = observers().at(-1)
    expect(observer, '應該已經在觀察 sentinel').toBeDefined()
    await act(async () => {
        observer!.trigger(true)
    })
}

function makeItem(overrides: Partial<NewsDataType> = {}): NewsDataType {
    return {
        article_id: 'news-1',
        title: '標題',
        description: '描述',
        content: '內文',
        image_url: '',
        pubDate: '2026-01-01',
        source_icon: '',
        source_name: '來源',
        source_url: '',
        rate: 0,
        favorite: false,
        favorites: 0,
        likes: 0,
        liked: false,
        views: 0,
        ...overrides,
    }
}

function makeResponse(overrides: Partial<NewsResponse> = {}): NewsResponse {
    return { success: true, data: [makeItem()], hasMore: false, total: 1, ...overrides }
}

const initialState = useNewsStore.getState()

beforeEach(() => {
    useNewsStore.setState(initialState, true)
    observers().length = 0
    getNewsActions.mockResolvedValue(makeResponse())
    toggleFavoriteAction.mockResolvedValue({ success: true, favorited: true, favorites: 1 })
    rateNewsAction.mockResolvedValue({ success: true, rate: 4 })
    incrementViewAction.mockResolvedValue({ success: true, views: 1 })
})

describe('useNewsFeed 初始狀態', () => {
    it('直接沿用伺服器渲染好的第一頁，不重新抓一次', async () => {
        const initial = makeResponse({ data: [makeItem({ article_id: 'a' })], total: 5 })

        const feed = renderFeed(initial)

        expect(feed.current.items).toEqual(initial.data)
        expect(feed.current.total).toBe(5)
        // 首次掛載就重抓等於把 SSR 的成果丟掉再打一次資料庫
        expect(getNewsActions).not.toHaveBeenCalled()
    })

    it('從第一頁資料推導出已收藏的項目', () => {
        const feed = renderFeed(
            makeResponse({
                data: [
                    makeItem({ article_id: 'a', favorite: true }),
                    makeItem({ article_id: 'b', favorite: false }),
                ],
            })
        )

        expect(feed.current.favorites).toEqual(['a'])
    })
})

describe('useNewsFeed 搜尋與排序', () => {
    it('搜尋字串改變時回到第一頁重查', async () => {
        renderFeed(makeResponse())

        act(() => useNewsStore.getState().setNewsQuery('颱風'))

        await waitFor(() =>
            expect(getNewsActions).toHaveBeenCalledWith({
                query: '颱風',
                sortType: 'date_desc',
                page: 1,
                limit: 12,
            })
        )
    })

    it('排序改變時回到第一頁重查', async () => {
        renderFeed(makeResponse())

        act(() => useNewsStore.getState().setSortType('likes'))

        await waitFor(() =>
            expect(getNewsActions).toHaveBeenCalledWith(
                expect.objectContaining({ sortType: 'likes', page: 1 })
            )
        )
    })

    it('重查的結果會取代舊資料而不是接在後面', async () => {
        const feed = renderFeed(makeResponse({ data: [makeItem({ article_id: 'old' })] }))
        getNewsActions.mockResolvedValue(makeResponse({ data: [makeItem({ article_id: 'new' })] }))

        act(() => useNewsStore.getState().setNewsQuery('颱風'))

        await waitFor(() => expect(feed.current.items.map((i) => i.article_id)).toEqual(['new']))
    })

    it('搜尋後收藏清單跟著換成新結果的收藏狀態', async () => {
        const feed = renderFeed(
            makeResponse({ data: [makeItem({ article_id: 'old', favorite: true })] })
        )
        getNewsActions.mockResolvedValue(
            makeResponse({ data: [makeItem({ article_id: 'new', favorite: false })] })
        )

        act(() => useNewsStore.getState().setNewsQuery('颱風'))

        await waitFor(() => expect(feed.current.favorites).toEqual([]))
    })

    it('載入失敗時提示使用者，並保留原本的內容', async () => {
        const feed = renderFeed(makeResponse({ data: [makeItem({ article_id: 'old' })] }))
        getNewsActions.mockResolvedValue({ ...makeResponse(), success: false })

        act(() => useNewsStore.getState().setNewsQuery('颱風'))

        await waitFor(() => expect(toastBox).toHaveBeenCalledWith('載入失敗，請稍後再試', 'error'))
        expect(feed.current.items.map((i) => i.article_id)).toEqual(['old'])
    })

    it('較舊的回應不會覆蓋較新的回應', async () => {
        // 使用者快速改兩次搜尋條件時，先發出的請求可能後回來
        let resolveFirst: (value: NewsResponse) => void = () => {}
        getNewsActions.mockReturnValueOnce(
            new Promise<NewsResponse>((resolve) => (resolveFirst = resolve))
        )
        const feed = renderFeed(makeResponse())

        act(() => useNewsStore.getState().setNewsQuery('第一次'))
        getNewsActions.mockResolvedValue(
            makeResponse({ data: [makeItem({ article_id: 'second' })] })
        )
        act(() => useNewsStore.getState().setNewsQuery('第二次'))

        await waitFor(() => expect(feed.current.items.map((i) => i.article_id)).toEqual(['second']))

        await act(async () => {
            resolveFirst(makeResponse({ data: [makeItem({ article_id: 'first' })] }))
        })

        expect(feed.current.items.map((i) => i.article_id)).toEqual(['second'])
    })
})

describe('useNewsFeed 無限捲動', () => {
    it('捲到底時載入下一頁並接在既有內容後面', async () => {
        const feed = renderFeed(
            makeResponse({ data: [makeItem({ article_id: 'a' })], hasMore: true, total: 2 })
        )
        getNewsActions.mockResolvedValue(
            makeResponse({ data: [makeItem({ article_id: 'b' })], hasMore: false, total: 2 })
        )

        await scrollToBottom()

        expect(getNewsActions).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }))
        await waitFor(() => expect(feed.current.items.map((i) => i.article_id)).toEqual(['a', 'b']))
    })

    it('連續載入時頁碼持續遞增', async () => {
        renderFeed(makeResponse({ data: [makeItem({ article_id: 'a' })], hasMore: true, total: 3 }))
        getNewsActions.mockResolvedValue(
            makeResponse({ data: [makeItem({ article_id: 'b' })], hasMore: true, total: 3 })
        )

        await scrollToBottom()
        await scrollToBottom()

        expect(getNewsActions).toHaveBeenNthCalledWith(1, expect.objectContaining({ page: 2 }))
        expect(getNewsActions).toHaveBeenNthCalledWith(2, expect.objectContaining({ page: 3 }))
    })

    it('新頁面的收藏會併入既有清單且不重複', async () => {
        const feed = renderFeed(
            makeResponse({
                data: [makeItem({ article_id: 'a', favorite: true })],
                hasMore: true,
                total: 3,
            })
        )
        getNewsActions.mockResolvedValue(
            makeResponse({
                data: [
                    makeItem({ article_id: 'a', favorite: true }),
                    makeItem({ article_id: 'b', favorite: true }),
                ],
                hasMore: false,
                total: 3,
            })
        )

        await scrollToBottom()

        await waitFor(() => expect(feed.current.favorites).toEqual(['a', 'b']))
    })

    it('沒有更多資料時捲到底也不載入', async () => {
        renderFeed(makeResponse({ hasMore: false }))

        await scrollToBottom()

        expect(getNewsActions).not.toHaveBeenCalled()
    })

    it('載入中重複觸發不會送出第二次請求', async () => {
        renderFeed(makeResponse({ hasMore: true, total: 24 }))
        let resolveFetch: (value: NewsResponse) => void = () => {}
        getNewsActions.mockReturnValue(
            new Promise<NewsResponse>((resolve) => (resolveFetch = resolve))
        )

        await scrollToBottom()
        await scrollToBottom()

        expect(getNewsActions).toHaveBeenCalledOnce()

        await act(async () => resolveFetch(makeResponse({ hasMore: false })))
    })
})

describe('useNewsFeed 收藏', () => {
    it('先更新畫面再送出請求，讓點擊立即有回饋', async () => {
        const feed = renderFeed(makeResponse({ data: [makeItem({ article_id: 'a' })] }))
        let resolveToggle: (value: unknown) => void = () => {}
        toggleFavoriteAction.mockReturnValue(new Promise((resolve) => (resolveToggle = resolve)))

        act(() => {
            feed.current.handleFavoriteClick('a')
        })

        expect(feed.current.favorites).toEqual(['a'])

        await act(async () => resolveToggle({ success: true, favorited: true, favorites: 1 }))
    })

    it('取消收藏會把項目移出清單', async () => {
        const feed = renderFeed(
            makeResponse({ data: [makeItem({ article_id: 'a', favorite: true })] })
        )
        toggleFavoriteAction.mockResolvedValue({ success: true, favorited: false, favorites: 0 })

        await act(async () => {
            await feed.current.handleFavoriteClick('a')
        })

        expect(feed.current.favorites).toEqual([])
        expect(toastBox).toHaveBeenCalledWith('移除收藏', 'success')
    })

    it('加入收藏成功時提示已收藏', async () => {
        const feed = renderFeed(makeResponse({ data: [makeItem({ article_id: 'a' })] }))

        await act(async () => {
            await feed.current.handleFavoriteClick('a')
        })

        expect(toastBox).toHaveBeenCalledWith('已收藏', 'success')
    })

    it('請求失敗時把畫面還原，避免顯示成功的假象', async () => {
        const feed = renderFeed(
            makeResponse({ data: [makeItem({ article_id: 'a', favorite: true })] })
        )
        toggleFavoriteAction.mockResolvedValue({ success: false })

        await act(async () => {
            await feed.current.handleFavoriteClick('a')
        })

        expect(feed.current.favorites).toEqual(['a'])
        expect(toastBox).not.toHaveBeenCalled()
    })
})

describe('useNewsFeed 評分', () => {
    it('評分後更新列表中的平均分數', async () => {
        const feed = renderFeed(makeResponse({ data: [makeItem({ article_id: 'a', rate: 1 })] }))
        rateNewsAction.mockResolvedValue({ success: true, rate: 4.5 })

        await act(async () => {
            await feed.current.handleRatingUpdate('a', 5)
        })

        expect(feed.current.items[0]?.rate).toBe(4.5)
    })

    it('同時更新開啟中的新聞詳情', async () => {
        const item = makeItem({ article_id: 'a', rate: 1 })
        const feed = renderFeed(makeResponse({ data: [item] }))

        await act(async () => {
            await feed.current.handleSelectNews(item)
        })
        rateNewsAction.mockResolvedValue({ success: true, rate: 4.5 })
        await act(async () => {
            await feed.current.handleRatingUpdate('a', 5)
        })

        expect(feed.current.selectedNews?.rate).toBe(4.5)
    })

    it('評分失敗時不動畫面上的分數', async () => {
        const feed = renderFeed(makeResponse({ data: [makeItem({ article_id: 'a', rate: 1 })] }))
        rateNewsAction.mockResolvedValue({ success: false, rate: 0 })

        await act(async () => {
            await feed.current.handleRatingUpdate('a', 5)
        })

        expect(feed.current.items[0]?.rate).toBe(1)
    })
})

describe('useNewsFeed 開啟新聞', () => {
    it('開啟新聞時累加瀏覽次數並更新畫面', async () => {
        const item = makeItem({ article_id: 'a', views: 3 })
        const feed = renderFeed(makeResponse({ data: [item] }))
        incrementViewAction.mockResolvedValue({ success: true, views: 4 })

        await act(async () => {
            await feed.current.handleSelectNews(item)
        })

        expect(incrementViewAction).toHaveBeenCalledWith('a')
        expect(feed.current.items[0]?.views).toBe(4)
        expect(feed.current.selectedNews).toEqual(item)
    })

    it('關閉新聞（傳 null）時不打瀏覽次數', async () => {
        const feed = renderFeed(makeResponse())

        await act(async () => {
            await feed.current.handleSelectNews(null)
        })

        expect(incrementViewAction).not.toHaveBeenCalled()
        expect(feed.current.selectedNews).toBeNull()
    })

    it('瀏覽次數失敗不影響開啟新聞', async () => {
        const item = makeItem({ article_id: 'a', views: 3 })
        const feed = renderFeed(makeResponse({ data: [item] }))
        incrementViewAction.mockRejectedValue(new Error('boom'))

        await act(async () => {
            await feed.current.handleSelectNews(item)
        })

        expect(feed.current.selectedNews).toEqual(item)
        expect(feed.current.items[0]?.views).toBe(3)
    })
})
