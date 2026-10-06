import { ServerWakingNotice } from '@/components/LoadNotices'
import { useServerWaking } from '@/components/useServerWaking'
import { OutlierList } from './OutlierList'
import { PayByDimension } from './PayByDimension'
import { SalaryHistogram } from './SalaryHistogram'
import { SummaryCards } from './SummaryCards'
import { usePayrollSummary } from './hooks'

export function InsightsPage() {
  // Every section hits the same server, so the summary stands in for all of them.
  const summary = usePayrollSummary()
  const isWakingServer = useServerWaking(summary.isPending && !summary.error)
  return (
    <div className="space-y-8">
      <h1 className="text-lg font-semibold">Insights</h1>
      {isWakingServer && <ServerWakingNotice />}
      <SummaryCards />
      <PayByDimension />
      <div className="grid gap-8 xl:grid-cols-2">
        <SalaryHistogram />
        <OutlierList />
      </div>
    </div>
  )
}
