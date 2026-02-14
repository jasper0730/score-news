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
        <div className="m-auto px-5 flex flex-col justify-center items-center gap-8 text-center">
            <div className="px-2 py-0.5 text-red-500 font-bold text-xl">ERROR 500</div>
            <h2 className="text-2xl font-bold">系統發生錯誤，請稍後再試</h2>
            <p className="text-xl text-gray-500">
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
