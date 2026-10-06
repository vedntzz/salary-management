import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  fetchPayByDimension,
  fetchPayOutliers,
  fetchPayrollSummary,
  fetchSalaryDistribution,
  type Dimension,
  type ReportCurrency,
} from '@/api/insights'

export function usePayrollSummary() {
  return useQuery({ queryKey: ['insights', 'summary'], queryFn: fetchPayrollSummary })
}

export function usePayByDimension(dimension: Dimension, currency: ReportCurrency) {
  return useQuery({
    queryKey: ['insights', 'by-dimension', dimension, currency],
    queryFn: () => fetchPayByDimension(dimension, currency),
    // Keep the current groups on screen while the next grouping loads, so nothing flashes.
    placeholderData: keepPreviousData,
  })
}

export function useSalaryDistribution(country: string) {
  return useQuery({
    queryKey: ['insights', 'distribution', country],
    queryFn: () => fetchSalaryDistribution(country),
  })
}

export function usePayOutliers() {
  return useQuery({ queryKey: ['insights', 'outliers'], queryFn: fetchPayOutliers })
}
