import { getUser } from '@/actions/getUser'
import NewsList from '@/app/(root)/NewsList'
import axios from 'axios'
import type { NewsApiResponse } from '@/types/news'

export const dynamic = 'force-dynamic'

const API_URL = process.env.API_URL

export default async function Home() {
    const currentUser = await getUser()
    let newsData: NewsApiResponse = { data: [], success: false }

    try {
        const res = await axios.get<NewsApiResponse>(`${API_URL}/api/news`, {
            params: {
                userId: currentUser?.id ?? null,
            },
        })
        newsData = res.data
    } catch (error) {
        console.error(error instanceof Error ? error.message : error)
    }

    return <NewsList data={newsData} />
}
