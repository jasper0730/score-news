'use client'

import Button from '@/components/atoms/Button'

interface ErrorPageProps {
    error: Error
    reset: () => void
}

const ErrorPage = ({ error, reset }: ErrorPageProps) => {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
            <p className="text-xl text-muted-foreground">發生錯誤：{error.message}</p>
            <Button variant="brand" onClick={reset}>
                重試
            </Button>
        </div>
    )
}

export default ErrorPage
