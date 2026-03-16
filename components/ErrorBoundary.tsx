'use client'

import { Component, ReactNode } from 'react'

interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, info)
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <div className="flex justify-center items-center min-h-screen">
                    <p className="text-xl text-gray-500">發生錯誤，請重新整理頁面。</p>
                </div>
            )
        }
        return this.props.children
    }
}

export default ErrorBoundary
