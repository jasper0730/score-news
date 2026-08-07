import { describe, expect, it } from 'vitest'
import { formatRelativeTime } from '@/libs/time'

const NOW = new Date('2026-08-07T12:00:00Z')
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString()

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('formatRelativeTime', () => {
    it.each([
        ['不到一分鐘', 30 * 1000, '剛剛'],
        ['3 分鐘', 3 * MINUTE, '3 分鐘前'],
        ['1 小時', HOUR, '1 小時前'],
        ['5 小時', 5 * HOUR, '5 小時前'],
        ['1 天', DAY, '昨天'],
        ['3 天', 3 * DAY, '3 天前'],
    ])('%s前', (_label, diff, expected) => {
        expect(formatRelativeTime(ago(diff), NOW)).toBe(expected)
    })

    it('超過 7 天改用絕對日期——「37 天前」既不好讀也不精確', () => {
        const result = formatRelativeTime(ago(37 * DAY), NOW)

        expect(result).not.toContain('前')
        expect(result).toMatch(/2026/)
    })

    it('剛好在邊界上不會跳到下一個單位', () => {
        expect(formatRelativeTime(ago(59 * 1000), NOW)).toBe('剛剛')
        expect(formatRelativeTime(ago(59 * MINUTE), NOW)).toBe('59 分鐘前')
        expect(formatRelativeTime(ago(23 * HOUR), NOW)).toBe('23 小時前')
    })

    it('未來時間當作剛剛——時鐘誤差不該顯示成「1 分鐘後」', () => {
        const future = new Date(NOW.getTime() + 5 * MINUTE).toISOString()

        expect(formatRelativeTime(future, NOW)).toBe('剛剛')
    })

    it('無法解析的時間回空字串，不讓 Invalid Date 出現在畫面上', () => {
        expect(formatRelativeTime('not a date', NOW)).toBe('')
    })
})
