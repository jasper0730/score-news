'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorPageProps {
    error: Error & { digest?: string }
    reset: () => void
}

const RootErrorPage = ({ error, reset }: ErrorPageProps) => {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col justify-center items-center min-h-screen gap-4">
            <p className="text-xl text-gray-500">發生錯誤，請稍後再試</p>
            <div className="flex gap-3">
                <Link href="/" className="px-4 py-2 border rounded-lg hover:opacity-80">
                    回首頁
                </Link>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-80 cursor-pointer"
                    onClick={reset}
                >
                    重試
                </button>
            </div>
        </div>
    )
}

export default RootErrorPage
