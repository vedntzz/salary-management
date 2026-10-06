import { useId, type ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { LoadError } from '@/components/LoadNotices'

interface QueryBodyProps<T> {
  label: string
  query: UseQueryResult<T>
  children: (data: T) => ReactNode
}

export function QueryBody<T>({ label, query, children }: QueryBodyProps<T>) {
  if (query.error) {
    return <LoadError title={`Couldn't load ${label}.`} message={query.error.message} onRetry={() => void query.refetch()} />
  }
  if (query.data === undefined) return <p className="py-6 text-sm text-muted-foreground">Loading {label}…</p>
  return children(query.data)
}

interface InsightsSectionProps<T> extends Omit<QueryBodyProps<T>, 'label'> {
  title: string
  controls?: ReactNode
}

export function InsightsSection<T>({ title, controls, query, children }: InsightsSectionProps<T>) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-2">
        <h2 id={headingId} className="text-sm font-semibold">{title}</h2>
        {controls}
      </div>
      <QueryBody label={title.toLowerCase()} query={query}>{children}</QueryBody>
    </section>
  )
}
