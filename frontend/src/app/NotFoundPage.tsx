import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section>
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        There is no page at this address.{' '}
        <Link to="/employees" className="text-primary underline underline-offset-4">
          Go to Employees
        </Link>
      </p>
    </section>
  )
}
