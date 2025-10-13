import RegisterClient from '@/components/register/RegisterClient'
import Link from 'next/link'

const LoginPage = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full px-10 pt-[100px] pb-[50px]">
            <RegisterClient type={'login'} className="max-w-md w-full" />
            <Link href="/" className="mt-5">
                回首頁
            </Link>
        </div>
    )
}

export default LoginPage
