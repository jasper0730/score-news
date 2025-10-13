import { getUser } from '@/actions/getUser'
import NewsCards from '@/app/(root)/NewsList'
import axios from 'axios'
const API_URL = process.env.API_URL
export default async function Home() {
    const currentUser = await getUser()
    let newsData = []
    try {
        const res = await axios.get(`${API_URL}/api/news`, {
            params: {
                userId: currentUser?.id || null,
            },
        })
        newsData = res.data
    } catch (error) {
        console.error(error instanceof Error ? error.message : error)
    }
    return (
        <>
            <NewsCards data={newsData} />
        </>
    )
}
