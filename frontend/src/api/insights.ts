import { apiRequest } from './client'

export type Dimension = 'country' | 'department' | 'job_title'
export type ReportCurrency = 'usd' | 'local'

// Every money figure carries its ISO code; the summary is always USD (D-016).
export interface PayrollSummary {
  currency: string
  headcount: number
  total_payroll: number
  median_payroll: number | null
  headcount_by_country: Record<string, number>
}

export interface GroupPayStats {
  group: string
  currency: string
  count: number
  min: number
  max: number
  avg: number
  median: number
}

export interface DimensionPayStats {
  dimension: Dimension
  rows: GroupPayStats[]
}

export interface SalaryBin {
  lower_bound: number
  upper_bound: number
  count: number
}

export interface SalaryDistribution {
  currency: string
  bins: SalaryBin[]
}

export interface Outlier {
  id: number
  employee_code: string
  name: string
  job_title: string
  country: string
  salary: number
  currency: string
  group_median: number
  deviation_percent: number
  direction: 'above' | 'below'
}

export interface OutlierReport {
  items: Outlier[]
}

export function fetchPayrollSummary(): Promise<PayrollSummary> {
  return apiRequest<PayrollSummary>('/api/insights/summary')
}

export function fetchPayByDimension(dimension: Dimension, currency: ReportCurrency): Promise<DimensionPayStats> {
  return apiRequest<DimensionPayStats>('/api/insights/by-dimension', { params: { dimension, currency } })
}

export function fetchSalaryDistribution(country: string): Promise<SalaryDistribution> {
  return apiRequest<SalaryDistribution>('/api/insights/distribution', { params: { country } })
}

export function fetchPayOutliers(): Promise<OutlierReport> {
  return apiRequest<OutlierReport>('/api/insights/outliers')
}
