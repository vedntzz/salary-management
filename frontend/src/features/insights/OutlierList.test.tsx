import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockInsightsApi, renderInsights } from './testing'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const SECTION = 'Outliers'

async function findOutlierItems(): Promise<HTMLElement[]> {
  const region = await screen.findByRole('region', { name: SECTION })
  return within(region).findAllByRole('listitem')
}

describe('Outlier list', () => {
  it('test_outlier_list_keeps_largest_deviation_first', async () => {
    // Arrange
    mockInsightsApi()

    // Act
    renderInsights()

    // Assert
    const items = await findOutlierItems()
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Ravi Menon')
    expect(items[1]).toHaveTextContent('Asha Rao')
  })

  it('test_outlier_row_shows_name_title_country_salary_and_group_median', async () => {
    // Arrange
    mockInsightsApi()

    // Act
    renderInsights()

    // Assert
    const [, asha] = await findOutlierItems()
    for (const text of ['Asha Rao', 'Senior Engineer', 'India', '3,185,000 INR', '2,450,000 INR']) {
      expect(within(asha).getByText(text, { exact: false })).toBeInTheDocument()
    }
  })

  it('test_outlier_row_shows_signed_percentage_above_median', async () => {
    // Arrange
    mockInsightsApi()

    // Act
    renderInsights()

    // Assert
    const [, asha] = await findOutlierItems()
    const deviation = within(asha).getByText('+30.0%')
    expect(deviation).toHaveAttribute('data-direction', 'above')
  })

  it('test_outlier_row_shows_signed_percentage_below_median', async () => {
    // Arrange
    mockInsightsApi()

    // Act
    renderInsights()

    // Assert
    const [ravi] = await findOutlierItems()
    // A true minus sign, so negative figures line up with positive ones in tabular digits.
    const deviation = within(ravi).getByText('−50.0%')
    expect(deviation).toHaveAttribute('data-direction', 'below')
  })

  it('test_outlier_row_links_to_employee_search_by_code', async () => {
    // Arrange
    mockInsightsApi()

    // Act
    renderInsights()

    // Assert
    const [, asha] = await findOutlierItems()
    expect(within(asha).getByRole('link', { name: 'Asha Rao' })).toHaveAttribute('href', '/employees?search=EMP-00001')
  })

  it('test_outlier_list_shows_empty_state_when_nobody_is_flagged', async () => {
    // Arrange
    mockInsightsApi({ replies: { outliers: { items: [] } } })

    // Act
    renderInsights()

    // Assert
    const region = await screen.findByRole('region', { name: SECTION })
    expect(await within(region).findByText(/no outliers/i)).toBeInTheDocument()
  })
})
