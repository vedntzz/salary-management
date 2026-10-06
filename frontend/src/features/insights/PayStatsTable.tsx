import type { Dimension, DimensionPayStats, GroupPayStats } from '@/api/insights'
import { formatCount, formatMoney } from '@/lib/format'
import { DIMENSION_LABELS } from './dimensions'

const STAT_COLUMNS: { label: string; format: (row: GroupPayStats) => string }[] = [
  { label: 'Count', format: (row) => formatCount(row.count) },
  { label: 'Min', format: (row) => formatMoney(row.min, row.currency) },
  { label: 'Median', format: (row) => formatMoney(row.median, row.currency) },
  { label: 'Avg', format: (row) => formatMoney(row.avg, row.currency) },
  { label: 'Max', format: (row) => formatMoney(row.max, row.currency) },
]

function PayStatsHeader({ dimension }: { dimension: Dimension }) {
  return (
    <thead>
      <tr className="border-b text-xs text-muted-foreground">
        <th className="py-2 pr-3 text-left font-medium">{DIMENSION_LABELS[dimension]}</th>
        {STAT_COLUMNS.map((column) => (
          <th key={column.label} className="py-2 pl-3 text-right font-medium">{column.label}</th>
        ))}
      </tr>
    </thead>
  )
}

export function PayStatsTable({ stats }: { stats: DimensionPayStats }) {
  return (
    <table className="w-full text-sm">
      <PayStatsHeader dimension={stats.dimension} />
      <tbody>
        {stats.rows.map((row) => (
          <tr key={row.group} className="border-b last:border-0">
            <td className="py-1.5 pr-3">{row.group}</td>
            {STAT_COLUMNS.map((column) => (
              <td key={column.label} className="py-1.5 pl-3 text-right tabular-nums">{column.format(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
