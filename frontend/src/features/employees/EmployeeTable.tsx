import {
  createColumnHelper,
  flexRender,
  tableFeatures,
  useTable,
  type Header,
  type Row,
} from '@tanstack/react-table'
import type { ReactNode } from 'react'
import type { Employee, EmployeeSort, SortKey } from '@/api/employees'
import { formatSalary } from '@/lib/format'
import { cn } from '@/lib/utils'

const features = tableFeatures({})
const helper = createColumnHelper<typeof features, Employee>()
type EmployeeHeader = Header<typeof features, Employee>
type EmployeeRow = Row<typeof features, Employee>

// Only these columns map to a sort the API supports.
const SORT_KEY_BY_COLUMN: Record<string, SortKey> = { name: 'name', salary: 'salary' }
const NUMERIC_COLUMNS = new Set(['salary'])
const EMPTY_ROWS: Employee[] = []

const columns = helper.columns([
  helper.accessor('employee_code', { header: 'Code' }),
  helper.accessor((employee) => `${employee.first_name} ${employee.last_name}`, {
    id: 'name',
    header: 'Name',
  }),
  helper.accessor('job_title', { header: 'Title' }),
  helper.accessor('department', { header: 'Department' }),
  helper.accessor('country', { header: 'Country' }),
  helper.accessor('salary_amount', {
    id: 'salary',
    header: 'Salary',
    cell: (info) => formatSalary(info.getValue(), info.row.original.salary_currency),
  }),
])

type CurrentSort = EmployeeSort | ''

function sortDirection(current: CurrentSort, key: SortKey): 'ascending' | 'descending' | 'none' {
  if (current === key) return 'ascending'
  if (current === `-${key}`) return 'descending'
  return 'none'
}

const SORT_INDICATOR = { ascending: '↑', descending: '↓', none: '' }

interface SortProps {
  sort: CurrentSort
  onSortChange: (sort: EmployeeSort) => void
}

function SortButton({ label, sortKey, sort, onSortChange }: SortProps & { label: string; sortKey: SortKey }) {
  const indicator = SORT_INDICATOR[sortDirection(sort, sortKey)]
  return (
    <button
      type="button"
      onClick={() => onSortChange(sort === sortKey ? `-${sortKey}` : sortKey)}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {label}
      {indicator && <span aria-hidden="true" className="text-primary">{indicator}</span>}
    </button>
  )
}

function HeaderCell({ header, sort, onSortChange }: SortProps & { header: EmployeeHeader }) {
  const sortKey = SORT_KEY_BY_COLUMN[header.column.id]
  const label = String(header.column.columnDef.header)
  return (
    <th
      aria-sort={sortKey ? sortDirection(sort, sortKey) : undefined}
      className={cn('px-3 py-2 text-left font-medium', NUMERIC_COLUMNS.has(header.column.id) && 'text-right')}
    >
      {sortKey ? <SortButton label={label} sortKey={sortKey} sort={sort} onSortChange={onSortChange} /> : label}
    </th>
  )
}

function bodyCellClassName(columnId: string): string {
  return cn('px-3 py-1.5 whitespace-nowrap', NUMERIC_COLUMNS.has(columnId) && 'text-right tabular-nums')
}

function EmployeeTableRow({ row, onOpen }: { row: EmployeeRow; onOpen: (employee: Employee) => void }) {
  return (
    <tr
      tabIndex={0}
      onClick={() => onOpen(row.original)}
      onKeyDown={(event) => event.key === 'Enter' && onOpen(row.original)}
      className="cursor-pointer border-b last:border-b-0 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
    >
      {row.getAllCells().map((cell) => (
        <td key={cell.id} className={bodyCellClassName(cell.column.id)}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  )
}

function TableMessage({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="px-3 py-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}

interface EmployeeTableProps extends SortProps {
  employees: Employee[] | undefined
  isLoading: boolean
  isRefreshing: boolean
  onRowOpen: (employee: Employee) => void
}

export function EmployeeTable({ employees, isLoading, isRefreshing, onRowOpen, ...sortProps }: EmployeeTableProps) {
  const table = useTable({ features, columns, data: employees ?? EMPTY_ROWS })
  const rows = table.getRowModel().rows
  return (
    <div className="overflow-x-auto border bg-card">
      <table className={cn('w-full text-sm', isRefreshing && 'opacity-60')}>
        <thead className="border-b bg-muted text-xs text-muted-foreground">
          <tr>
            {table.getFlatHeaders().map((header) => <HeaderCell key={header.id} header={header} {...sortProps} />)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => <EmployeeTableRow key={row.id} row={row} onOpen={onRowOpen} />)}
        </tbody>
      </table>
      {isLoading && <TableMessage>Loading employees…</TableMessage>}
      {!isLoading && rows.length === 0 && <TableMessage>No employees match these filters.</TableMessage>}
    </div>
  )
}
