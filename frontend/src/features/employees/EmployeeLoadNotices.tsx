import { Button } from '@/components/ui/button'

export function EmployeeLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-4 border border-destructive/40 bg-card px-3 py-3 text-sm">
      <p>
        <span className="font-medium text-destructive">Couldn't load employees.</span> {message}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

export function ServerWakingNotice() {
  return (
    <p role="status" className="border-l-2 border-primary bg-muted px-3 py-2 text-sm text-muted-foreground">
      Waking up the server, this can take up to a minute on the free tier.
    </p>
  )
}
