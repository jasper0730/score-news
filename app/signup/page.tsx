import RegisterForm from '@/components/organisms/RegisterForm'

const SignUpPage = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full px-10 pt-[100px] pb-[50px]">
            <RegisterForm type="signup" className="max-w-md w-full" />
        </div>
    )
}

export default SignUpPage
