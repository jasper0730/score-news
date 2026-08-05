'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/atoms/Button'

interface ErrorPageProps {
    error: Error & { digest?: string }
    reset: () => void
}

const RootErrorPage = ({ error, reset }: ErrorPageProps) => {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
            <p className="text-xl text-muted-foreground">發生錯誤，請稍後再試</p>
            <div className="flex gap-3">
                <Link href="/">
                    <Button variant="outline">回首頁</Button>
                </Link>
                <Button variant="brand" onClick={reset}>
                    重試
                </Button>
            </div>
        </div>
    )
}

export default RootErrorPage
