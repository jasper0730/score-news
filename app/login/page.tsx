import RegisterForm from '@/components/organisms/RegisterForm'
import Link from 'next/link'

const LoginPage = () => {
    return (
        <div className="flex w-full flex-col items-center justify-center px-5 pb-12 pt-24 sm:px-10">
            <RegisterForm type="login" className="w-full max-w-md" />
            <Link href="/" className="mt-5 hover:underline">
                回首頁
            </Link>
        </div>
    )
}

export default LoginPage
