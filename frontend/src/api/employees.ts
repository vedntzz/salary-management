import { apiRequest } from './client'

export interface Employee {
  id: number
  employee_code: string
  first_name: string
  last_name: string
  email: string
  job_title: string
  department: string
  country: string
  salary_amount: number
  salary_currency: string
  hire_date: string
  created_at: string
  updated_at: string
}

export interface EmployeePage {
  items: Employee[]
  total: number
  page: number
  page_size: number
}

export interface FilterOptions {
  countries: string[]
  departments: string[]
  job_titles: string[]
}

export type SortKey = 'name' | 'salary' | 'hire_date'
export type EmployeeSort = SortKey | `-${SortKey}`

// A type alias, not an interface, so it satisfies the client's index-signature params.
export type EmployeeListParams = {
  search: string
  country: string
  department: string
  job_title: string
  sort: EmployeeSort | ''
  page: number
  page_size: number
}

export function fetchEmployees(params: EmployeeListParams): Promise<EmployeePage> {
  return apiRequest<EmployeePage>('/api/employees', { params })
}

export function fetchFilterOptions(): Promise<FilterOptions> {
  return apiRequest<FilterOptions>('/api/meta/filters')
}
