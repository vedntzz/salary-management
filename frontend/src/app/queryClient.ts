import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/client'

const MAX_RETRIES = 1

export function shouldRetryRequest(failureCount: number, error: unknown): boolean {
  // A 4xx means the request itself is wrong, so sending it again can't help.
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < MAX_RETRIES
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Single HR user on one screen: refetching on every tab focus is noise, not freshness.
      queries: { retry: shouldRetryRequest, refetchOnWindowFocus: false },
    },
  })
}
