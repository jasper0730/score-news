import { useCallback, useEffect, useState } from "react";


async function sendHttpRequest(url: string, config: object) {
  const res = await fetch(url, config)
  const resData = await res.json()
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`)
  }

  return resData
}

export default function useFetch(url: string, config: RequestInit = { method: 'GET' }, initData = []) {
  const [data, setData] = useState(initData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const sendRequest = useCallback(async () => {
    setIsLoading(true);
    try {
      const resData = await sendHttpRequest(url, config)
      setData(resData)
    } catch (error) {
      console.error('error:', error)
      setError('something went wrong')
    }
    setIsLoading(false);
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