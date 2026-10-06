import type { PayrollSummary } from '@/api/insights'
import { formatCount, formatMoney } from '@/lib/format'
import { QueryBody } from './InsightsSection'
import { usePayrollSummary } from './hooks'

function SummaryStats({ summary }: { summary: PayrollSummary }) {
  const { currency, median_payroll: median } = summary
  const stats = [
    { label: 'Headcount', value: formatCount(summary.headcount) },
    { label: 'Total payroll', value: formatMoney(summary.total_payroll, currency) },
    { label: 'Median salary', value: median === null ? '—' : formatMoney(median, currency) },
  ]
  return (
    <dl className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {stats.map((stat) => (
        <div key={stat.label} className="px-5 py-1 first:pl-0">
          <dt className="text-xs text-muted-foreground">{stat.label}</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function SummaryCards() {
  const query = usePayrollSummary()
  return (
    <section aria-label="Payroll summary" className="border-y py-4">
      <QueryBody label="summary" query={query}>
        {(summary) => <SummaryStats summary={summary} />}
      </QueryBody>
    </section>
  )
}
