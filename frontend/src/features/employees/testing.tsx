import { render } from '@testing-library/react'
import { vi, type Mock } from 'vitest'
import App from '@/App'
import { createTestQueryClient } from '@/test/queryClient'

export const FILTER_OPTIONS = {
  countries: ['Germany', 'India', 'United States'],
  departments: ['Engineering', 'Finance'],
  job_titles: ['Analyst', 'Engineer', 'Senior Engineer'],
  currency_by_country: { Germany: 'EUR', India: 'INR', 'United States': 'USD' },
}

function buildEmployee(id: number, fields: Record<string, string | number>) {
  return {
    id,
    employee_code: `EMP-0000${id}`,
    email: `employee${id}@acme.test`,
    hire_date: '2021-04-01',
    created_at: '2024-01-01T00:00:00',
    updated_at: '2024-01-01T00:00:00',
    ...fields,
  }
}

export const EMPLOYEES = [
  buildEmployee(1, {
    first_name: 'Asha', last_name: 'Rao', job_title: 'Senior Engineer',
    department: 'Engineering', country: 'India', salary_amount: 2450000, salary_currency: 'INR',
  }),
  buildEmployee(2, {
    first_name: 'John', last_name: 'Smith', job_title: 'Analyst',
    department: 'Finance', country: 'United States', salary_amount: 185000, salary_currency: 'USD',
  }),
  buildEmployee(3, {
    first_name: 'Lena', last_name: 'Vogel', job_title: 'Engineer',
    department: 'Engineering', country: 'Germany', salary_amount: 72000, salary_currency: 'EUR',
  }),
]

export function employeePage(overrides: Record<string, unknown> = {}) {
  return { items: EMPLOYEES, total: EMPLOYEES.length, page: 1, page_size: 20, ...overrides }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

export const CREATED_EMPLOYEE = buildEmployee(4, {
  first_name: 'Maya', last_name: 'Iyer', job_title: 'Analyst',
  department: 'Finance', country: 'India', salary_amount: 1800000, salary_currency: 'INR',
})

type MockResponse = { status: number; body?: unknown }

interface MockApiOptions {
  page?: ReturnType<typeof employeePage>
  employeesPending?: boolean
  employeesError?: { status: number; detail: string }
  mutationResponse?: MockResponse
}

const DEFAULT_MUTATION_RESPONSES: Record<string, MockResponse> = {
  POST: { status: 201, body: CREATED_EMPLOYEE },
  PATCH: { status: 200, body: EMPLOYEES[0] },
  DELETE: { status: 204 },
}

function mutationReply({ status, body }: MockResponse): Response {
  return body === undefined ? new Response(null, { status }) : jsonResponse(body, status)
}

export function mockEmployeesApi(options: MockApiOptions = {}): Mock {
  const { page = employeePage(), employeesPending = false, employeesError, mutationResponse } = options
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    if (method !== 'GET') return mutationReply(mutationResponse ?? DEFAULT_MUTATION_RESPONSES[method])
    if (url.includes('/api/meta/filters')) return jsonResponse(FILTER_OPTIONS)
    // A promise that never settles keeps the table in its loading state.
    if (employeesPending) return new Promise<Response>(() => {})
    if (employeesError) return jsonResponse({ detail: employeesError.detail }, employeesError.status)
    return jsonResponse(page)
  })
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('VITE_API_URL', 'http://api.test')
  return fetchMock
}

export function employeeRequests(fetchMock: Mock): URLSearchParams[] {
  return fetchMock.mock.calls
    .filter(([, init]) => (init?.method ?? 'GET') === 'GET')
    .map(([url]) => new URL(String(url)))
    .filter((url) => url.pathname === '/api/employees')
    .map((url) => url.searchParams)
}

export interface SentMutation {
  method: string
  path: string
  body: unknown
}

export function mutationRequests(fetchMock: Mock): SentMutation[] {
  return fetchMock.mock.calls
    .filter(([, init]) => (init?.method ?? 'GET') !== 'GET')
    .map(([url, init]) => ({
      method: init.method,
      path: new URL(String(url)).pathname,
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    }))
}

export function lastEmployeeRequest(fetchMock: Mock): URLSearchParams {
  const requests = employeeRequests(fetchMock)
  return requests[requests.length - 1] ?? new URLSearchParams()
}

export function currentUrlParams(): URLSearchParams {
  return new URLSearchParams(window.location.search)
}

export function renderEmployeesAt(path: string) {
  window.history.pushState({}, '', path)
  return render(<App queryClient={createTestQueryClient()} />)
}
