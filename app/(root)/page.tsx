import { getNewsActions } from '@/actions/newsActions'
import NewsList from '@/app/(root)/NewsList'
import { NEWS_PAGE_SIZE } from '@/constants/common'
import type { NewsResponse } from '@/actions/newsActions'

export default async function Home() {
    // 只取第一頁，其餘由 client 捲動時再向伺服器要。
    // 使用者身分由 getNewsActions 內部自 session 解析，這裡不需要先查一次。
    let newsData: NewsResponse = {
        data: [],
        success: false,
        hasMore: false,
        total: 0,
    }

    try {
        newsData = await getNewsActions({ page: 1, limit: NEWS_PAGE_SIZE })
    } catch (error) {
        console.error(error instanceof Error ? error.message : error)
    }

    return <NewsList data={newsData} />
}
