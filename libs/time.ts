const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const relative = new Intl.RelativeTimeFormat('zh-TW', { numeric: 'auto' })

/**
 * 把時間戳轉成「3 分鐘前」這種相對敘述。
 *
 * 超過 7 天就改回絕對日期——「37 天前」這種說法既不好讀也不精確，
 * 使用者真正想知道的是哪一天。
 *
 * 只在 client component 使用。相對時間的結果會隨當下時刻改變，
 * 若在伺服器算好再送到瀏覽器，兩邊的「現在」不同會造成 hydration mismatch。
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
    const then = new Date(iso)
    if (Number.isNaN(then.getTime())) return ''

    const diff = now.getTime() - then.getTime()

    // 時鐘誤差或伺服器時間略快時 diff 會是負的，當作「剛剛」而不是「1 分鐘後」
    if (diff < MINUTE) return '剛剛'
    if (diff < HOUR) return relative.format(-Math.floor(diff / MINUTE), 'minute')
    if (diff < DAY) return relative.format(-Math.floor(diff / HOUR), 'hour')
    if (diff < 7 * DAY) return relative.format(-Math.floor(diff / DAY), 'day')

    return then.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
}
