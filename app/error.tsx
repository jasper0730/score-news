'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import Button from '@/components/atoms/Button'

interface ErrorPageProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="error-page">
            <div className="error-page__code">ERROR 500</div>
            <h2 className="error-page__title">系統發生錯誤，請稍後再試</h2>
            <p className="error-page__message">
                Something went wrong, so this page is broken.
            </p>
            <div className="error-page__actions">
                <Link href="/">
                    <Button variant="outline">回到首頁</Button>
                </Link>
                <Button variant="outline" onClick={() => reset()}>
                    重新整理
                </Button>
            </div>
        </div>
    )
}
