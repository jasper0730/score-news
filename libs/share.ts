export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export interface ShareTarget {
    title: string
    description?: string
    /** 原文連結。目前站上沒有單篇文章的路由，只能分享回原始新聞 */
    link?: string
    source_url?: string
}

/**
 * 分享一篇新聞。
 *
 * 優先用 Web Share API——行動裝置上會叫出系統原生的分享面板，
 * 使用者可以直接送到 LINE、訊息或任何已安裝的 app。
 * 桌面瀏覽器多半沒有這個 API，退回複製連結到剪貼簿。
 *
 * 回傳結果而非自行顯示提示：要顯示什麼訊息是呼叫端的決定，
 * 這個函式只負責「分享這件事」。
 */
export async function shareArticle(article: ShareTarget): Promise<ShareResult> {
    const url = article.link || article.source_url
    if (!url) return 'failed'

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
            await navigator.share({ title: article.title, text: article.description, url })
            return 'shared'
        } catch (error) {
            // 使用者在原生面板按取消會丟 AbortError，那不是錯誤，
            // 不該退回去複製連結——他明確表示不想分享。
            //
            // 用 name 而非 instanceof Error 判斷：取消丟的是 DOMException，
            // 它在部分環境（jsdom、跨 realm）並不是 Error 的實例。
            if ((error as { name?: string } | null)?.name === 'AbortError') return 'cancelled'
            // 其他錯誤（例如非安全來源）就往下試剪貼簿
        }
    }

    try {
        await navigator.clipboard.writeText(url)
        return 'copied'
    } catch {
        return 'failed'
    }
}
