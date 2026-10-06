import { useState } from 'react'
import type { Dimension, ReportCurrency } from '@/api/insights'
import { CurrencyToggle, LabelledSelect } from './controls'
import { DIMENSION_LABELS } from './dimensions'
import { InsightsSection } from './InsightsSection'
import { MedianPayChart } from './MedianPayChart'
import { PayStatsTable } from './PayStatsTable'
import { usePayByDimension } from './hooks'

const DIMENSION_OPTIONS = Object.entries(DIMENSION_LABELS).map(([value, label]) => ({ value, label }))

function usePayGrouping() {
  const [dimension, setDimension] = useState<Dimension>('country')
  const [currency, setCurrency] = useState<ReportCurrency>('usd')
  const changeDimension = (next: Dimension) => {
    setDimension(next)
    // Only country groups share one currency; the API rejects local for any other grouping.
    if (next !== 'country') setCurrency('usd')
  }
  return { dimension, currency, changeDimension, setCurrency }
}

type PayGrouping = ReturnType<typeof usePayGrouping>

function PayGroupingControls({ dimension, currency, changeDimension, setCurrency }: PayGrouping) {
  return (
    <div className="flex items-end gap-3">
      <LabelledSelect label="Group by" value={dimension} options={DIMENSION_OPTIONS}
        onChange={(value) => changeDimension(value as Dimension)} />
      <CurrencyToggle currency={currency} localEnabled={dimension === 'country'} onChange={setCurrency} />
    </div>
  )
}

export function PayByDimension() {
  const grouping = usePayGrouping()
  const query = usePayByDimension(grouping.dimension, grouping.currency)
  return (
    <InsightsSection title="Pay by group" controls={<PayGroupingControls {...grouping} />} query={query}>
      {(stats) => (
        <div className="grid gap-8 xl:grid-cols-[3fr_2fr]">
          <PayStatsTable stats={stats} />
          <MedianPayChart dimension={grouping.dimension} />
        </div>
      )}
    </InsightsSection>
  )
}
