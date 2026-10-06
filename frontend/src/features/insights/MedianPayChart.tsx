import { useId } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Dimension, GroupPayStats } from '@/api/insights'
import { formatCompactCount, formatMoney } from '@/lib/format'
import { ACCENT_FILL, AXIS_TICK, GRID_STROKE, HOVER_CURSOR, TOOLTIP_STYLE } from './chartStyle'
import { DIMENSION_LABELS } from './dimensions'
import { usePayByDimension } from './hooks'

const ROW_HEIGHT = 30
const AXIS_HEIGHT = 30

function MedianBars({ rows, height }: { rows: GroupPayStats[]; height: number }) {
  return (
    <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 480, height }}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
        <XAxis type="number" tickFormatter={formatCompactCount} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="group" width={128} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <Tooltip cursor={HOVER_CURSOR} contentStyle={TOOLTIP_STYLE} formatter={(value) => formatMoney(Number(value), 'USD')} />
        <Bar dataKey="median" name="Median" fill={ACCENT_FILL} barSize={14} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Always USD: medians in different local currencies can't share one axis.
export function MedianPayChart({ dimension }: { dimension: Dimension }) {
  const { data } = usePayByDimension(dimension, 'usd')
  const captionId = useId()
  if (!data || data.rows.length === 0) return null
  return (
    <figure aria-labelledby={captionId} className="space-y-2">
      <figcaption id={captionId} className="text-xs text-muted-foreground">
        Median pay by {DIMENSION_LABELS[data.dimension].toLowerCase()} (USD)
      </figcaption>
      <MedianBars rows={data.rows} height={data.rows.length * ROW_HEIGHT + AXIS_HEIGHT} />
    </figure>
  )
}
