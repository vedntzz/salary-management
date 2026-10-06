import { EmployeeFilters } from './EmployeeFilters'
import { EmployeePagination } from './EmployeePagination'
import { EmployeeTable } from './EmployeeTable'
import { useEmployeeListParams, useEmployees } from './hooks'

export function EmployeesPage() {
  const { params, setSearch, setFilter, setSort, setPage } = useEmployeeListParams()
  const { data, isPending, isPlaceholderData } = useEmployees(params)
  return (
    <section className="space-y-4">
      <h1 className="text-lg font-semibold">Employees</h1>
      <EmployeeFilters params={params} onSearchChange={setSearch} onFilterChange={setFilter} />
      <EmployeeTable
        employees={data?.items}
        isLoading={isPending}
        isRefreshing={isPlaceholderData}
        sort={params.sort}
        onSortChange={setSort}
      />
      {data && <EmployeePagination page={data.page} pageSize={data.page_size} total={data.total} onPageChange={setPage} />}
    </section>
  )
}
