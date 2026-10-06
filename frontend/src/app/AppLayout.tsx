import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/employees', label: 'Employees' },
  { to: '/insights', label: 'Insights' },
]

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    'block border-l-2 px-3 py-1.5 text-sm',
    isActive
      ? 'border-primary font-medium text-foreground'
      : 'border-transparent text-muted-foreground hover:text-foreground',
  )
}

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-52 shrink-0 border-r bg-sidebar">
        <p className="px-4 py-4 text-sm font-semibold tracking-tight">ACME Salary</p>
        <nav aria-label="Main" className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClassName}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-6">
        <Outlet />
      </main>
    </div>
  )
}
