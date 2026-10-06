import type { CSSProperties } from 'react'

// One accent for data, neutrals for everything else, so the bars are the only colour on the page.
export const ACCENT_FILL = 'var(--color-primary)'
export const GRID_STROKE = 'var(--color-border)'
export const AXIS_TICK = { fill: 'var(--color-muted-foreground)', fontSize: 12 }
export const HOVER_CURSOR = { fill: 'var(--color-muted)' }

export const TOOLTIP_STYLE: CSSProperties = {
  background: 'var(--color-popover)',
  border: '1px solid var(--color-border)',
  borderRadius: 4,
  fontSize: 12,
}
