import { useCallback, useEffect, useRef, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  fetchFilterOptions,
  updateEmployee,
  type EmployeeFields,
  type EmployeeListParams,
  type EmployeeSort,
} from '@/api/employees'

export const PAGE_SIZE = 20
const SORT_OPTIONS: readonly string[] = ['name', '-name', 'salary', '-salary', 'hire_date', '-hire_date']

export type EmployeeFilterKey = 'country' | 'department' | 'job_title'

function readPage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function readSort(value: string | null): EmployeeSort | '' {
  return value && SORT_OPTIONS.includes(value) ? (value as EmployeeSort) : ''
}

export function readEmployeeListParams(searchParams: URLSearchParams): EmployeeListParams {
  return {
    search: searchParams.get('search') ?? '',
    country: searchParams.get('country') ?? '',
    department: searchParams.get('department') ?? '',
    job_title: searchParams.get('job_title') ?? '',
    sort: readSort(searchParams.get('sort')),
    page: readPage(searchParams.get('page')),
    page_size: PAGE_SIZE,
  }
}

function applyUrlChanges(current: URLSearchParams, changes: Record<string, string>): URLSearchParams {
  const next = new URLSearchParams(current)
  for (const [key, value] of Object.entries(changes)) {
    if (value) next.set(key, value)
    else next.delete(key)
  }
  // Page 1 is the default, so it stays out of the URL.
  if (next.get('page') === '1') next.delete('page')
  return next
}

export function useEmployeeListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  // Every change pushes a history entry so Back steps through what the user looked at.
  const updateUrl = useCallback(
    (changes: Record<string, string>) => setSearchParams((current) => applyUrlChanges(current, changes)),
    [setSearchParams],
  )
  return {
    params: readEmployeeListParams(searchParams),
    // Any change to what is listed starts again from page 1.
    setSearch: (search: string) => updateUrl({ search, page: '' }),
    setFilter: (key: EmployeeFilterKey, value: string) => updateUrl({ [key]: value, page: '' }),
    setSort: (sort: EmployeeSort) => updateUrl({ sort, page: '' }),
    setPage: (page: number) => updateUrl({ page: String(page) }),
  }
}

export function useEmployees(params: EmployeeListParams) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => fetchEmployees(params),
    // Keep the current page on screen while the next one loads, so the table doesn't flash.
    placeholderData: keepPreviousData,
  })
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60 * 1000,
  })
}

export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
): (...args: Args) => void {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const latestCallback = useRef(callback)
  useEffect(() => {
    latestCallback.current = callback
  })
  useEffect(() => () => clearTimeout(timer.current), [])
  return useCallback(
    (...args: Args) => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => latestCallback.current(...args), delayMs)
    },
    [delayMs],
  )
}

export function useTextFollowingUrl(urlValue: string): [string, (text: string) => void] {
  const [text, setText] = useState(urlValue)
  const [syncedValue, setSyncedValue] = useState(urlValue)
  // When the URL changes underneath the input (Back, Forward), the text follows it.
  if (urlValue !== syncedValue) {
    setSyncedValue(urlValue)
    setText(urlValue)
  }
  return [text, setText]
}

function refreshEmployeeQueries(queryClient: QueryClient): Promise<unknown> {
  // A save can add a new title or department, so the filter options go stale too.
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['employees'] }),
    queryClient.invalidateQueries({ queryKey: ['filter-options'] }),
  ])
}

export function useSaveEmployee(employeeId: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fields: EmployeeFields) =>
      employeeId === null ? createEmployee(fields) : updateEmployee(employeeId, fields),
    onSuccess: () => refreshEmployeeQueries(queryClient),
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => refreshEmployeeQueries(queryClient),
  })
}

export function useReturnFocus() {
  const opener = useRef<HTMLElement | null>(null)
  const remember = useCallback(() => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
  }, [])
  const restore = useCallback((event: Event) => {
    // The drawer opens from state, not a Radix trigger, so Radix has nowhere to send focus back.
    event.preventDefault()
    opener.current?.focus()
  }, [])
  return { remember, restore }
}
