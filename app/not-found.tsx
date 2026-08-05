import Link from 'next/link'
import Button from '@/components/atoms/Button'

export default function NotFound() {
    return (
        <div className="m-auto flex flex-col items-center justify-center gap-8 px-5 text-center">
            <div className="px-2 py-0.5 text-xl font-bold text-danger">ERROR 404</div>
            <h2 className="text-2xl font-semibold">Page not found</h2>
            <p className="text-xl text-muted-foreground">
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
