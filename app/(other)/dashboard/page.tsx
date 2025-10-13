import { getUser } from '@/actions/getUser'
import DashboardNewsList from './DashboardNewsList'

const DashboardPage = async () => {
    const currentUser = await getUser()
    return (
        <>
            <DashboardNewsList user={currentUser} />
        </>
    )
}

export default DashboardPage
