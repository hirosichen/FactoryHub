import { useState, useEffect, useCallback, useRef } from 'react'

export function useAutoRefresh<T>(
  generator: () => T,
  intervalMs: number = 5000,
) {
  const [data, setData] = useState<T>(generator)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isLive, setIsLive] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(() => {
    setData(generator())
    setLastUpdated(new Date())
  }, [generator])

  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(refresh, intervalMs)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isLive, refresh, intervalMs])

  const toggle = useCallback(() => setIsLive(prev => !prev), [])

  return { data, lastUpdated, isLive, refresh, toggle }
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString('zh-TW', { hour12: false })
}
