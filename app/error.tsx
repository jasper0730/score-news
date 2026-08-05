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
        <div className="m-auto flex flex-col items-center justify-center gap-8 px-5 text-center">
            <div className="px-2 py-0.5 text-xl font-bold text-danger">ERROR 500</div>
            <h2 className="text-2xl font-semibold">系統發生錯誤，請稍後再試</h2>
            <p className="text-xl text-muted-foreground">
                Something went wrong, so this page is broken.
            </p>
            <div className="flex gap-4">
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
