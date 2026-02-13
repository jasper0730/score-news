import Link from 'next/link'
import Button from '@/components/atoms/Button'

export default function NotFound() {
    return (
        <div className="error-page">
            <div className="error-page__code">ERROR 404</div>
            <h2 className="error-page__title">Page not found</h2>
            <p className="error-page__message">
                Something went wrong, so this page is broken.
            </p>
            <div className="error-page__actions">
                <Link href="/">
                    <Button variant="outline">回到首頁</Button>
                </Link>
            </div>
        </div>
    )
}
