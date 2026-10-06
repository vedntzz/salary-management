import { QueryClient } from '@tanstack/react-query'

// No retries in tests, so a failing request shows its error state at once.
export function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}
