import { useCallback, useEffect, useState } from 'react'

async function sendHttpRequest<T>(url: string, config: RequestInit): Promise<T> {
    const res = await fetch(url, config)
    const resData: T = await res.json()

    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
    }

    return resData
}

export default function useFetch<T>(
    url: string,
    config: RequestInit = { method: 'GET' },
    initData: T
) {
    const [data, setData] = useState<T>(initData)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>()

    const sendRequest = useCallback(async () => {
        setIsLoading(true)
        try {
            const resData = await sendHttpRequest<T>(url, config)
            setData(resData)
        } catch (err) {
            console.error('error:', err)
            setError('something went wrong')
        }
        setIsLoading(false)
    }, [url, config])

    useEffect(() => {
        if (config.method === 'GET') {
            sendRequest()
        }
    }, [sendRequest, config])

    return {
        data,
        isLoading,
        error,
        sendRequest,
    }
}
