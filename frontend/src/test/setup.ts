import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

const unmockedRequests: string[] = []

beforeEach(() => {
  unmockedRequests.length = 0
  // A request no test mocked would reach a real server, so record it and fail the test.
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown) => {
      unmockedRequests.push(String(input))
      throw new Error(`Unmocked fetch: ${String(input)}`)
    }),
  )
})

afterEach(() => {
  cleanup()
  if (unmockedRequests.length > 0) {
    throw new Error(`Test made unmocked requests: ${unmockedRequests.join(', ')}`)
  }
})
