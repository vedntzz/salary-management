import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const CONTROL_CLASS =
  'h-8 w-full rounded-sm border border-input bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:border-destructive read-only:bg-muted read-only:text-muted-foreground'

export interface ControlProps {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

interface FormFieldProps {
  id: string
  label: string
  error?: string
  className?: string
  children: (control: ControlProps) => ReactNode
}

export function FormField({ id, label, error, className, children }: FormFieldProps) {
  const errorId = `${id}-error`
  // The error is the control's description, so screen readers announce it with the field.
  const control: ControlProps = error ? { id, 'aria-invalid': true, 'aria-describedby': errorId } : { id }
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children(control)}
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

interface OptionListProps {
  placeholder: string
  options: string[]
}

export function OptionList({ placeholder, options }: OptionListProps) {
  return (
    <>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </>
  )
}
