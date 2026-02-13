import RegisterForm from '@/components/organisms/RegisterForm'

const SignUpPage = () => {
    return (
        <div className="auth-page">
            <RegisterForm type="signup" className="auth-page__form" />
        </div>
    )
}

export default SignUpPage
