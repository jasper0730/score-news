import RegisterForm from '@/components/organisms/RegisterForm'
import Link from 'next/link'

const LoginPage = () => {
    return (
        <div className="auth-page">
            <RegisterForm type="login" className="auth-page__form" />
            <Link href="/" className="auth-page__home-link">
                回首頁
            </Link>
        </div>
    )
}

export default LoginPage
