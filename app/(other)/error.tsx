'use client'

interface ErrorPageProps {
    error: Error
    reset: () => void
}

const ErrorPage = ({ error, reset }: ErrorPageProps) => {
    return (
        <div className="flex flex-col justify-center items-center min-h-screen gap-4">
            <p className="text-xl text-gray-500">發生錯誤：{error.message}</p>
            <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-80 cursor-pointer"
                onClick={reset}
            >
                重試
            </button>
        </div>
    )
}

export default ErrorPage
