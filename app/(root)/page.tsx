import { getUser } from '@/actions/getUser'
import { getNewsActions } from '@/actions/newsActions'
import NewsList from '@/app/(root)/NewsList'
import type { NewsApiResponse } from '@/types/news'

export default async function Home() {
    const currentUser = await getUser()
    let newsData: NewsApiResponse = { data: [], success: false }

    try {
        const result = await getNewsActions({ userId: currentUser?.id ?? null, page: 1, limit: 1000 })
        newsData = { data: result.data, success: result.success }
    } catch (error) {
        console.error(error instanceof Error ? error.message : error)
    }

    return <NewsList data={newsData} />
}
