import { EmployeeFilters } from './EmployeeFilters'
import { EmployeeLoadError, ServerWakingNotice } from './EmployeeLoadNotices'
import { EmployeePagination } from './EmployeePagination'
import { EmployeeTable } from './EmployeeTable'
import { useDelayedFlag, useEmployeeListParams, useEmployees } from './hooks'

// Render's free tier sleeps; a first load slower than this is almost always a cold start.
const COLD_START_NOTICE_MS = 3000

export function EmployeesPage() {
  const { params, setSearch, setFilter, setSort, setPage } = useEmployeeListParams()
  const { data, error, isPending, isPlaceholderData, refetch } = useEmployees(params)
  const isWakingServer = useDelayedFlag(isPending && !error, COLD_START_NOTICE_MS)
  return (
    <section className="space-y-4">
      <h1 className="text-lg font-semibold">Employees</h1>
      <EmployeeFilters params={params} onSearchChange={setSearch} onFilterChange={setFilter} />
      {isWakingServer && <ServerWakingNotice />}
      {error ? (
        <EmployeeLoadError message={error.message} onRetry={() => void refetch()} />
      ) : (
        <EmployeeTable employees={data?.items} isLoading={isPending} isRefreshing={isPlaceholderData}
          sort={params.sort} onSortChange={setSort} />
      )}
      {data && <EmployeePagination page={data.page} pageSize={data.page_size} total={data.total} onPageChange={setPage} />}
    </section>
  )
}
