import RegisterForm from '@/components/organisms/RegisterForm'

const SignUpPage = () => {
    return (
        <div className="flex w-full flex-col items-center justify-center px-5 pb-12 pt-24 sm:px-10">
            <RegisterForm type="signup" className="w-full max-w-md" />
        </div>
    )
}

export default SignUpPage
