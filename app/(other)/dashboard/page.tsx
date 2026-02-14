import { getUser } from '@/actions/getUser'
import DashboardContent from './DashboardContent'

const DashboardPage = async () => {
    const currentUser = await getUser()
    return <DashboardContent user={currentUser} />
}

export default DashboardPage
