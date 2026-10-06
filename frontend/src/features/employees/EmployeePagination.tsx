import { Button } from '@/components/ui/button'
import { formatCount } from '@/lib/format'

interface EmployeePaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function EmployeePagination({ page, pageSize, total, onPageChange }: EmployeePaginationProps) {
  if (total === 0) return null
  const firstRow = (page - 1) * pageSize + 1
  const lastRow = Math.min(page * pageSize, total)
  return (
    <div className="flex items-center justify-end gap-3 text-sm">
      <span className="text-muted-foreground tabular-nums">
        {`${formatCount(firstRow)}–${formatCount(lastRow)} of ${formatCount(total)}`}
      </span>
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous page
      </Button>
      <Button variant="outline" size="sm" disabled={lastRow >= total} onClick={() => onPageChange(page + 1)}>
        Next page
      </Button>
    </div>
  )
}
