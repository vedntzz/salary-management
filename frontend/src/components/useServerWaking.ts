import { useEffect, useState } from 'react'

// Render's free tier sleeps; a first load slower than this is almost always a cold start.
const COLD_START_NOTICE_MS = 3000

export function useDelayedFlag(active: boolean, delayMs: number): boolean {
  const [elapsed, setElapsed] = useState(false)
  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => setElapsed(true), delayMs)
    return () => {
      clearTimeout(timer)
      setElapsed(false)
    }
  }, [active, delayMs])
  return active && elapsed
}

export function useServerWaking(isFirstLoadPending: boolean): boolean {
  return useDelayedFlag(isFirstLoadPending, COLD_START_NOTICE_MS)
}
