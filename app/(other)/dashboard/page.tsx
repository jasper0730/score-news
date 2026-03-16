import { redirect } from 'next/navigation'
import { getUser } from '@/actions/getUser'
import DashboardContent from './DashboardContent'

const DashboardPage = async () => {
    const currentUser = await getUser()
    console.log('[DashboardPage] currentUser:', currentUser ? `id=${currentUser.id}, email=${currentUser.email}` : 'NULL')
    if (!currentUser) {
        redirect('/login')
    }
    return <DashboardContent user={currentUser} />
}

export default DashboardPage
