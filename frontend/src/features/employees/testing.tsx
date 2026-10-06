import { render } from '@testing-library/react'
import { vi, type Mock } from 'vitest'
import App from '@/App'

export const FILTER_OPTIONS = {
  countries: ['Germany', 'India', 'United States'],
  departments: ['Engineering', 'Finance'],
  job_titles: ['Analyst', 'Engineer', 'Senior Engineer'],
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

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })
}

interface MockApiOptions {
  page?: ReturnType<typeof employeePage>
  employeesPending?: boolean
}

export function mockEmployeesApi({ page = employeePage(), employeesPending = false }: MockApiOptions = {}): Mock {
  const fetchMock = vi.fn(async (url: string) => {
    if (url.includes('/api/meta/filters')) return jsonResponse(FILTER_OPTIONS)
    // A promise that never settles keeps the table in its loading state.
    if (employeesPending) return new Promise<Response>(() => {})
    return jsonResponse(page)
  })
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('VITE_API_URL', 'http://api.test')
  return fetchMock
}

export function employeeRequests(fetchMock: Mock): URLSearchParams[] {
  return fetchMock.mock.calls
    .map(([url]) => new URL(String(url)))
    .filter((url) => url.pathname === '/api/employees')
    .map((url) => url.searchParams)
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
  return render(<App />)
}
