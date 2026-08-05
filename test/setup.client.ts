import '@testing-library/jest-dom/vitest'
import { createElement } from 'react'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// next/image 在 jsdom 裡會把 fill / priority 這類自訂 prop 傳給真正的 <img>，
// React 會為每個未知屬性噴警告。換成單純的 img，測試才看得到真正的訊息。
const NEXT_ONLY_IMAGE_PROPS = [
    'fill',
    'priority',
    'loader',
    'quality',
    'placeholder',
    'blurDataURL',
    'unoptimized',
]

vi.mock('next/image', () => ({
    default: (props: Record<string, unknown>) =>
        createElement(
            'img',
            Object.fromEntries(
                Object.entries(props).filter(([key]) => !NEXT_ONLY_IMAGE_PROPS.includes(key))
            )
        ),
}))

// 每個測試結束就卸載元件，否則下一個測試的 screen 查詢會撈到上一個測試殘留的 DOM
afterEach(() => {
    cleanup()
})

// jsdom 沒有實作 IntersectionObserver，useNewsFeed 的無限捲動會直接爆掉。
// 這裡給一個可控的替身，測試可以自己觸發 callback 模擬捲到底。
class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null
    readonly rootMargin: string = ''
    readonly thresholds: ReadonlyArray<number> = []

    static instances: MockIntersectionObserver[] = []

    constructor(private readonly callback: IntersectionObserverCallback) {
        MockIntersectionObserver.instances.push(this)
    }

    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
    takeRecords = vi.fn(() => [])

    /** 測試用：模擬 sentinel 進入畫面 */
    trigger(isIntersecting = true) {
        this.callback(
            [{ isIntersecting } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver
        )
    }
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

export { MockIntersectionObserver }
