import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SUMMARY, mockInsightsApi, renderInsights } from './testing'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

// A <dl> pairs each label with its value, so the value is the term's definition.
function summaryValue(label: string): string {
  const strip = screen.getByRole('region', { name: 'Payroll summary' })
  return within(strip).getByText(label).nextElementSibling?.textContent ?? ''
}

describe('Summary strip', () => {
  it('test_summary_strip_shows_headcount', async () => {
    // Arrange
    mockInsightsApi()

    // Act
    renderInsights()

    // Assert
    await waitFor(() => expect(summaryValue('Headcount')).toBe('10,000'))
  })

  it('test_summary_strip_shows_total_payroll_in_usd', async () => {
    // Arrange
    mockInsightsApi()

    // Act
    renderInsights()

    // Assert
    await waitFor(() => expect(summaryValue('Total payroll')).toBe('1,234,567,890 USD'))
  })

  it('test_summary_strip_shows_median_payroll_in_usd', async () => {
    // Arrange
    mockInsightsApi()

    // Act
    renderInsights()

    // Assert
    await waitFor(() => expect(summaryValue('Median salary')).toBe('84,500 USD'))
  })

  it('test_summary_strip_shows_dash_for_median_when_no_employees', async () => {
    // Arrange
    mockInsightsApi({ replies: { summary: { ...SUMMARY, headcount: 0, total_payroll: 0, median_payroll: null } } })

    // Act
    renderInsights()

    // Assert
    await waitFor(() => expect(summaryValue('Median salary')).toBe('—'))
  })
})
