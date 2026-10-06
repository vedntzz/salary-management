import { render, screen } from '@testing-library/react'
import { vi, type Mock } from 'vitest'
import App from '@/App'
import { FILTER_OPTIONS } from '@/features/employees/testing'
import { createTestQueryClient } from '@/test/queryClient'

export type InsightsEndpoint = 'summary' | 'by-dimension' | 'distribution' | 'outliers'

export const SUMMARY = {
  currency: 'USD',
  headcount: 10000,
  total_payroll: 1234567890,
  median_payroll: 84500,
  headcount_by_country: { Germany: 1250, India: 1250, 'United States': 1250 },
}

function groupStats(group: string, currency: string, stats: number[]) {
  const [count, min, median, avg, max] = stats
  return { group, currency, count, min, median, avg, max }
}

const GROUPS_BY_DIMENSION: Record<string, string[]> = {
  country: ['India', 'United States'],
  department: ['Engineering', 'Finance'],
  job_title: ['Analyst', 'Engineer'],
}

const LOCAL_CURRENCY: Record<string, string> = { India: 'INR', 'United States': 'USD' }

export function dimensionStats(dimension: string, currency: string) {
  const [first, second] = GROUPS_BY_DIMENSION[dimension]
  const firstCurrency = currency === 'local' ? LOCAL_CURRENCY[first] : 'USD'
  return {
    dimension,
    rows: [
      groupStats(first, firstCurrency, [1250, 900000, 2450000, 2500000, 6100000]),
      groupStats(second, 'USD', [1250, 62000, 118000, 121500, 240000]),
    ],
  }
}

export function distribution(country: string | null) {
  const currency = country === 'India' ? 'INR' : 'USD'
  return {
    currency,
    bins: [
      { lower_bound: 10000, upper_bound: 60000, count: 4200 },
      { lower_bound: 60000, upper_bound: 110000, count: 3800 },
      { lower_bound: 110000, upper_bound: 160000, count: 2000 },
    ],
  }
}

function outlier(id: number, fields: Record<string, string | number>) {
  return { id, employee_code: `EMP-0000${id}`, ...fields }
}

// Already in API order: largest absolute deviation first (D-008).
export const OUTLIERS = {
  items: [
    outlier(7, {
      name: 'Ravi Menon', job_title: 'Analyst', country: 'India', salary: 600000, currency: 'INR',
      group_median: 1200000, deviation_percent: -50.0, direction: 'below',
    }),
    outlier(1, {
      name: 'Asha Rao', job_title: 'Senior Engineer', country: 'India', salary: 3185000, currency: 'INR',
      group_median: 2450000, deviation_percent: 30.0, direction: 'above',
    }),
  ],
}

function defaultReply(endpoint: InsightsEndpoint, params: URLSearchParams): unknown {
  if (endpoint === 'summary') return SUMMARY
  if (endpoint === 'by-dimension') return dimensionStats(params.get('dimension') ?? '', params.get('currency') ?? 'usd')
  if (endpoint === 'distribution') return distribution(params.get('country'))
  return OUTLIERS
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

interface MockInsightsOptions {
  replies?: Partial<Record<InsightsEndpoint, unknown>>
  failing?: Partial<Record<InsightsEndpoint, string>>
  pending?: boolean
}

export function mockInsightsApi(options: MockInsightsOptions = {}): Mock {
  const { replies = {}, failing = {}, pending = false } = options
  const fetchMock = vi.fn(async (input: string) => {
    const url = new URL(input)
    if (url.pathname === '/api/meta/filters') return jsonResponse(FILTER_OPTIONS)
    const endpoint = url.pathname.replace('/api/insights/', '') as InsightsEndpoint
    // A promise that never settles keeps every section in its loading state.
    if (pending) return new Promise<Response>(() => {})
    const failure = failing[endpoint]
    if (failure) return jsonResponse({ detail: failure }, 500)
    return jsonResponse(replies[endpoint] ?? defaultReply(endpoint, url.searchParams))
  })
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('VITE_API_URL', 'http://api.test')
  return fetchMock
}

export function insightsRequests(fetchMock: Mock, endpoint: InsightsEndpoint): URLSearchParams[] {
  return fetchMock.mock.calls
    .map(([url]) => new URL(String(url)))
    .filter((url) => url.pathname === `/api/insights/${endpoint}`)
    .map((url) => url.searchParams)
}

export function lastInsightsRequest(fetchMock: Mock, endpoint: InsightsEndpoint): URLSearchParams {
  const requests = insightsRequests(fetchMock, endpoint)
  return requests[requests.length - 1] ?? new URLSearchParams()
}

export function renderInsights() {
  window.history.pushState({}, '', '/insights')
  return render(<App queryClient={createTestQueryClient()} />)
}

export function section(name: string): HTMLElement {
  return screen.getByRole('region', { name })
}
