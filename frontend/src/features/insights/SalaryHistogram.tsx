import { useId, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SalaryBin, SalaryDistribution } from '@/api/insights'
import { useFilterOptions } from '@/features/employees/hooks'
import { formatCompactCount, formatCount } from '@/lib/format'
import { ACCENT_FILL, AXIS_TICK, GRID_STROKE, HOVER_CURSOR, TOOLTIP_STYLE } from './chartStyle'
import { LabelledSelect } from './controls'
import { InsightsSection } from './InsightsSection'
import { useSalaryDistribution } from './hooks'

const CHART_HEIGHT = 240

function describeBin(bin: SalaryBin | undefined, currency: string): string {
  return bin ? `${formatCount(bin.lower_bound)}–${formatCount(bin.upper_bound)} ${currency}` : ''
}

function DistributionBars({ distribution }: { distribution: SalaryDistribution }) {
  const { bins, currency } = distribution
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT} initialDimension={{ width: 480, height: CHART_HEIGHT }}>
      <BarChart data={bins} barCategoryGap={2} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} />
        <XAxis dataKey="lower_bound" tickFormatter={formatCompactCount} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatCount} width={48} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <Tooltip cursor={HOVER_CURSOR} contentStyle={TOOLTIP_STYLE} formatter={(value) => [formatCount(Number(value)), 'Employees']}
          labelFormatter={(_, payload) => describeBin(payload[0]?.payload as SalaryBin | undefined, currency)} />
        <Bar dataKey="count" fill={ACCENT_FILL} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function DistributionChart({ distribution, place }: { distribution: SalaryDistribution; place: string }) {
  const captionId = useId()
  if (distribution.bins.every((bin) => bin.count === 0)) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No salaries to show for this selection.</p>
  }
  return (
    <figure aria-labelledby={captionId} className="space-y-2">
      <figcaption id={captionId} className="text-xs text-muted-foreground">
        Salary distribution, {place} ({distribution.currency})
      </figcaption>
      <DistributionBars distribution={distribution} />
    </figure>
  )
}

export function SalaryHistogram() {
  const [country, setCountry] = useState('')
  const query = useSalaryDistribution(country)
  const { data: filterOptions } = useFilterOptions()
  const countries = (filterOptions?.countries ?? []).map((name) => ({ value: name, label: name }))
  const controls = (
    <LabelledSelect label="Country" value={country} onChange={setCountry}
      options={[{ value: '', label: 'All countries' }, ...countries]} />
  )
  return (
    <InsightsSection title="Salary distribution" controls={controls} query={query}>
      {(distribution) => <DistributionChart distribution={distribution} place={country || 'all countries'} />}
    </InsightsSection>
  )
}
