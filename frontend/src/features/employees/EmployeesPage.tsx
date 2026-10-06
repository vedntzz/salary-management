import { useState } from 'react'
import type { Employee, EmployeeListParams, EmployeeSort } from '@/api/employees'
import { Button } from '@/components/ui/button'
import { EmployeeDrawer, type EmployeeDrawerTarget } from './EmployeeDrawer'
import { EmployeeFilters } from './EmployeeFilters'
import { EmployeeLoadError, ServerWakingNotice } from './EmployeeLoadNotices'
import { EmployeePagination } from './EmployeePagination'
import { EmployeeTable } from './EmployeeTable'
import { useDelayedFlag, useEmployeeListParams, useEmployees } from './hooks'

// Render's free tier sleeps; a first load slower than this is almost always a cold start.
const COLD_START_NOTICE_MS = 3000

interface EmployeeResultsProps {
  params: EmployeeListParams
  onSortChange: (sort: EmployeeSort) => void
  onPageChange: (page: number) => void
  onRowOpen: (employee: Employee) => void
}

function EmployeeResults({ params, onSortChange, onPageChange, onRowOpen }: EmployeeResultsProps) {
  const { data, error, isPending, isPlaceholderData, refetch } = useEmployees(params)
  const isWakingServer = useDelayedFlag(isPending && !error, COLD_START_NOTICE_MS)
  return (
    <>
      {isWakingServer && <ServerWakingNotice />}
      {error ? (
        <EmployeeLoadError message={error.message} onRetry={() => void refetch()} />
      ) : (
        <EmployeeTable employees={data?.items} isLoading={isPending} isRefreshing={isPlaceholderData}
          sort={params.sort} onSortChange={onSortChange} onRowOpen={onRowOpen} />
      )}
      {data && <EmployeePagination page={data.page} pageSize={data.page_size} total={data.total} onPageChange={onPageChange} />}
    </>
  )
}

export function EmployeesPage() {
  const { params, setSearch, setFilter, setSort, setPage } = useEmployeeListParams()
  const [drawer, setDrawer] = useState<EmployeeDrawerTarget | null>(null)
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Employees</h1>
        <Button onClick={() => setDrawer({ mode: 'create' })}>Add employee</Button>
      </div>
      <EmployeeFilters params={params} onSearchChange={setSearch} onFilterChange={setFilter} />
      <EmployeeResults params={params} onSortChange={setSort} onPageChange={setPage}
        onRowOpen={(employee) => setDrawer({ mode: 'edit', employee })} />
      <EmployeeDrawer target={drawer} onClose={() => setDrawer(null)} />
    </section>
  )
}
