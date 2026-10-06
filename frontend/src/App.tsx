import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/app/AppLayout'
import { NotFoundPage } from '@/app/NotFoundPage'
import { EmployeesPage } from '@/features/employees/EmployeesPage'
import { InsightsPage } from '@/features/insights/InsightsPage'

function createQueryClient(): QueryClient {
  // Single HR user on one screen: refetching on every tab focus is noise, not freshness.
  return new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } })
}

function App() {
  const [queryClient] = useState(createQueryClient)
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/employees" replace />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
