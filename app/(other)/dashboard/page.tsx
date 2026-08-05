import { redirect } from 'next/navigation'
import { getUser } from '@/actions/getUser'
import DashboardContent from './DashboardContent'

const DashboardPage = async () => {
    const currentUser = await getUser()
    if (!currentUser) {
        redirect('/login')
    }
    return <DashboardContent user={currentUser} />
}

export default DashboardPage
