import { useId } from 'react'
import type { ReportCurrency } from '@/api/insights'
import { cn } from '@/lib/utils'

const CONTROL_CLASS =
  'h-8 rounded-sm border border-input bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40'

export interface SelectOption {
  value: string
  label: string
}

interface LabelledSelectProps {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}

export function LabelledSelect({ label, value, options, onChange }: LabelledSelectProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-muted-foreground">{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={CONTROL_CLASS}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}

const CURRENCY_OPTIONS: { value: ReportCurrency; label: string }[] = [
  { value: 'usd', label: 'USD' },
  { value: 'local', label: 'Local' },
]

const SEGMENT_CLASS = cn(
  'flex cursor-pointer items-center rounded-xs px-2.5 text-sm',
  'has-[:checked]:bg-primary has-[:checked]:text-primary-foreground',
  'has-[:disabled]:cursor-not-allowed has-[:disabled]:text-muted-foreground/50',
  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/40',
)

interface CurrencyToggleProps {
  currency: ReportCurrency
  localEnabled: boolean
  onChange: (currency: ReportCurrency) => void
}

export function CurrencyToggle({ currency, localEnabled, onChange }: CurrencyToggleProps) {
  const name = useId()
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-xs text-muted-foreground">Currency</legend>
      <div className="flex h-8 rounded-sm border border-input bg-card p-0.5">
        {CURRENCY_OPTIONS.map((option) => (
          <label key={option.value} className={SEGMENT_CLASS}
            title={option.value === 'local' && !localEnabled ? 'Local currency needs grouping by country' : undefined}>
            <input type="radio" name={name} value={option.value} className="sr-only"
              checked={currency === option.value} disabled={option.value === 'local' && !localEnabled}
              onChange={() => onChange(option.value)} />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
