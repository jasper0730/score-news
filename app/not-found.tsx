import Link from 'next/link'
import Button from '@/components/atoms/Button'

export default function NotFound() {
    return (
        <div className="m-auto px-5 flex flex-col justify-center items-center gap-8 text-center">
            <div className="px-2 py-0.5 text-red-500 font-bold text-xl">ERROR 404</div>
            <h2 className="text-2xl font-bold">Page not found</h2>
            <p className="text-xl text-gray-500">
                Something went wrong, so this page is broken.
            </p>
            <div className="flex gap-4">
                <Link href="/">
                    <Button variant="outline">回到首頁</Button>
                </Link>
            </div>
        </div>
    )
}
