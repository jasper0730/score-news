'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toastBox } from '@/utils/toast'
import { z } from 'zod'
import Logo from '@/components/atoms/Logo'
import Input from '@/components/atoms/Input'
import Button from '@/components/atoms/Button'
import type { AuthFormType } from '@/types/news'

interface RegisterFormProps {
    type: AuthFormType
    setOpenModal?: (type: AuthFormType | null) => void
    className?: string
}

interface FormErrors {
    email?: string
    password?: string
}

const formValueSchema = z.object({
    email: z.string({ required_error: 'Email 為必填欄位' }).email('請輸入正確的 Email'),
    password: z
        .string({ required_error: 'Password 為必填欄位' })
        .min(8, '密碼長度不可小於 8 個字元'),
})

const SOCIAL_PROVIDERS = [
    { id: 'facebook', label: 'FaceBook', variant: 'social-facebook' as const },
    { id: 'google', label: 'Google', variant: 'social-google' as const },
    { id: 'github', label: 'Github', variant: 'social-github' as const },
] as const

const RegisterForm = ({ type, setOpenModal, className = '' }: RegisterFormProps) => {
    const router = useRouter()
    const formRef = useRef<HTMLFormElement>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<FormErrors>({})

    // 有 setOpenModal 代表是彈窗開起來的，沒有則是 /login、/signup 這兩個獨立頁面
    const isModal = Boolean(setOpenModal)

    /**
     * 登入成功後不再強制跳去後台（後台已收在頭像選單裡）。
     * 彈窗登入就留在原頁面，只用 router.refresh() 重新取一次伺服器資料，
     * 讓收藏狀態這類由 server component 帶下來的內容跟著更新。
     */
    const handlePostLogin = () => {
        if (isModal) {
            router.refresh()
        } else {
            router.replace('/')
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        const result = formValueSchema.safeParse({ email, password })
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors
            setErrors({
                email: fieldErrors.email?.[0],
                password: fieldErrors.password?.[0],
            })
            setIsLoading(false)
            return
        }

        setErrors({})

        try {
            if (type === 'login') {
                const res = await signIn('credentials', {
                    email,
                    password,
                    redirect: false,
                })
                if (res?.error) {
                    toastBox(res.error || '登入失敗', 'error')
                } else {
                    toastBox('登入成功', 'success')
                    setOpenModal?.(null)
                    handlePostLogin()
                }
            }

            if (type === 'signup') {
                const res = await fetch('/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                })
                if (!res.ok) {
                    const errorData: { error?: string } = await res.json()
                    throw new Error(errorData.error ?? '註冊失敗')
                }

                toastBox('註冊完成，請重新登入', 'success')
                setOpenModal?.('login')
            }
        } catch (error) {
            console.error('Error during authentication:', error)
            toastBox('發生未知錯誤，請稍後再試', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSocialLogin = async (providerId: string) => {
        setIsLoading(true)
        try {
            const res = await signIn(providerId, {
                redirect: false,
                // 從彈窗登入就回到當下這頁，從 /login 頁登入則回首頁
                callbackUrl: isModal ? window.location.pathname : '/',
            })
            if (res?.ok) {
                toastBox('登入成功！', 'success')
                setOpenModal?.(null)
                handlePostLogin()
            }
        } catch (error) {
            console.error('Social login error:', error)
            toastBox('登入失敗！', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSwitchType = (targetType: AuthFormType) => {
        if (setOpenModal) {
            setOpenModal(targetType)
        } else {
            router.push(targetType === 'login' ? '/login' : '/signup')
        }
    }

    return (
        <div className={className}>
            <div className="mb-5 flex flex-col items-center justify-center">
                <Logo />
                <h2 className="mt-2 text-3xl font-semibold">
                    {type === 'login' ? '登入 ScoreNews' : '創建一個帳戶'}
                </h2>
            </div>

            {type === 'login' && (
                <p className="text-center text-sm">
                    還沒加入 ScoreNews 嗎？
                    <button
                        type="button"
                        className="ml-1 cursor-pointer text-danger hover:underline"
                        onClick={() => handleSwitchType('signup')}
                    >
                        註冊
                    </button>
                </p>
            )}

            {type === 'signup' && (
                <p className="text-center text-sm">
                    已經加入 ScoreNews 嗎？
                    <button
                        type="button"
                        className="ml-1 cursor-pointer text-danger hover:underline"
                        onClick={() => handleSwitchType('login')}
                    >
                        登入
                    </button>
                </p>
            )}

            <form ref={formRef} className="mt-3 flex flex-col" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-3">
                    <Input
                        name="email"
                        type="text"
                        placeholder="Email"
                        error={errors.email}
                        defaultValue={type === 'login' ? 'test@test.com' : undefined}
                    />
                    <Input
                        name="password"
                        type="password"
                        placeholder="Password"
                        error={errors.password}
                        defaultValue={type === 'login' ? 'test1234' : undefined}
                    />
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    className="mt-8"
                    disabled={isLoading}
                >
                    {type === 'login' ? '登入' : '註冊'}
                </Button>
            </form>

            {type === 'login' && (
                <div className="mt-3 flex gap-2">
                    {SOCIAL_PROVIDERS.map(({ id, label, variant }) => (
                        <Button
                            key={id}
                            variant={variant}
                            size="sm"
                            fullWidth
                            type="button"
                            onClick={() => handleSocialLogin(id)}
                            disabled={isLoading}
                        >
                            {label}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default RegisterForm
