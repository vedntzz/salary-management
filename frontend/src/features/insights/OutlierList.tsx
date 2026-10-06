import { Link } from 'react-router-dom'
import type { Outlier } from '@/api/insights'
import { formatMoney, formatSignedPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { InsightsSection } from './InsightsSection'
import { usePayOutliers } from './hooks'

function OutlierRow({ outlier }: { outlier: Outlier }) {
  const { currency, direction } = outlier
  return (
    <li className="grid grid-cols-[1fr_auto_auto_4rem] items-baseline gap-x-5 py-2 text-sm">
      <div className="min-w-0">
        <Link to={`/employees?search=${encodeURIComponent(outlier.employee_code)}`} className="font-medium hover:underline">
          {outlier.name}
        </Link>
        <p className="truncate text-xs text-muted-foreground">{outlier.job_title} · {outlier.country}</p>
      </div>
      <span className="text-right tabular-nums">{formatMoney(outlier.salary, currency)}</span>
      <span className="text-right text-xs text-muted-foreground tabular-nums">median {formatMoney(outlier.group_median, currency)}</span>
      <span data-direction={direction}
        className={cn('text-right font-medium tabular-nums', direction === 'above' ? 'text-primary' : 'text-muted-foreground')}>
        {formatSignedPercent(outlier.deviation_percent)}
      </span>
    </li>
  )
}

export function OutlierList() {
  const query = usePayOutliers()
  const note = <p className="text-xs text-muted-foreground">More than 25% from the median for the same title and country</p>
  return (
    <InsightsSection title="Outliers" controls={note} query={query}>
      {(report) =>
        report.items.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No outliers: everyone is within 25% of their group median.</p>
        ) : (
          <ol className="divide-y">
            {report.items.map((outlier) => <OutlierRow key={outlier.id} outlier={outlier} />)}
          </ol>
        )
      }
    </InsightsSection>
  )
}
