import { useState } from 'react'
import type { Employee, EmployeeListParams, EmployeeSort } from '@/api/employees'
import { LoadError, ServerWakingNotice } from '@/components/LoadNotices'
import { Button } from '@/components/ui/button'
import { useServerWaking } from '@/components/useServerWaking'
import { EmployeeDrawer, type EmployeeDrawerTarget } from './EmployeeDrawer'
import { EmployeeFilters } from './EmployeeFilters'
import { EmployeePagination } from './EmployeePagination'
import { EmployeeTable } from './EmployeeTable'
import { useEmployeeListParams, useEmployees, useReturnFocus } from './hooks'

interface EmployeeResultsProps {
  params: EmployeeListParams
  onSortChange: (sort: EmployeeSort) => void
  onPageChange: (page: number) => void
  onRowOpen: (employee: Employee) => void
}

function EmployeeResults({ params, onSortChange, onPageChange, onRowOpen }: EmployeeResultsProps) {
  const { data, error, isPending, isPlaceholderData, refetch } = useEmployees(params)
  const isWakingServer = useServerWaking(isPending && !error)
  return (
    <>
      {isWakingServer && <ServerWakingNotice />}
      {error ? (
        <LoadError title="Couldn't load employees." message={error.message} onRetry={() => void refetch()} />
      ) : (
        <EmployeeTable employees={data?.items} isLoading={isPending} isRefreshing={isPlaceholderData}
          sort={params.sort} onSortChange={onSortChange} onRowOpen={onRowOpen} />
      )}
      {data && <EmployeePagination page={data.page} pageSize={data.page_size} total={data.total} onPageChange={onPageChange} />}
    </>
  )
}

function useEmployeeDrawer() {
  const [target, setTarget] = useState<EmployeeDrawerTarget | null>(null)
  const focusReturn = useReturnFocus()
  return {
    target,
    open: (next: EmployeeDrawerTarget) => {
      focusReturn.remember()
      setTarget(next)
    },
    close: () => setTarget(null),
    restoreFocus: focusReturn.restore,
  }
}

export function EmployeesPage() {
  const { params, setSearch, setFilter, setSort, setPage } = useEmployeeListParams()
  const drawer = useEmployeeDrawer()
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Employees</h1>
        <Button onClick={() => drawer.open({ mode: 'create' })}>Add employee</Button>
      </div>
      <EmployeeFilters params={params} onSearchChange={setSearch} onFilterChange={setFilter} />
      <EmployeeResults params={params} onSortChange={setSort} onPageChange={setPage}
        onRowOpen={(employee) => drawer.open({ mode: 'edit', employee })} />
      <EmployeeDrawer target={drawer.target} onClose={drawer.close} onCloseAutoFocus={drawer.restoreFocus} />
    </section>
  )
}
