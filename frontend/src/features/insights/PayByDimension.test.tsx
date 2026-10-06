import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { lastInsightsRequest, mockInsightsApi, renderInsights, section } from './testing'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const SECTION = 'Pay by group'

function cellTexts(row: HTMLElement): string[] {
  return within(row).getAllByRole('cell').map((cell) => cell.textContent ?? '')
}

async function chooseGroup(name: string) {
  await userEvent.selectOptions(within(section(SECTION)).getByLabelText('Group by'), name)
}

describe('Pay by dimension', () => {
  it('test_pay_by_dimension_requests_country_in_usd_by_default', async () => {
    // Arrange
    const fetchMock = mockInsightsApi()

    // Act
    renderInsights()

    // Assert
    await waitFor(() => expect(lastInsightsRequest(fetchMock, 'by-dimension').get('dimension')).toBe('country'))
    expect(lastInsightsRequest(fetchMock, 'by-dimension').get('currency')).toBe('usd')
  })

  it('test_pay_by_dimension_table_shows_count_min_median_avg_max', async () => {
    // Arrange
    mockInsightsApi()

    // Act
    renderInsights()

    // Assert
    const table = await within(section(SECTION)).findByRole('table')
    const headers = within(table).getAllByRole('columnheader').map((header) => header.textContent)
    expect(headers).toEqual(['Country', 'Count', 'Min', 'Median', 'Avg', 'Max'])
    const row = within(table).getByRole('row', { name: /United States/ })
    expect(cellTexts(row)).toEqual([
      'United States', '1,250', '62,000 USD', '118,000 USD', '121,500 USD', '240,000 USD',
    ])
  })

  it('test_pay_by_dimension_selector_offers_country_department_title', async () => {
    // Arrange
    mockInsightsApi()

    // Act
    renderInsights()

    // Assert
    const selector = within(await screen.findByRole('region', { name: SECTION })).getByLabelText('Group by')
    const options = within(selector).getAllByRole('option').map((option) => option.textContent)
    expect(options).toEqual(['Country', 'Department', 'Title'])
  })

  it('test_pay_by_dimension_choosing_title_requests_job_title_groups', async () => {
    // Arrange
    const fetchMock = mockInsightsApi()
    renderInsights()
    await within(await screen.findByRole('region', { name: SECTION })).findByRole('table')

    // Act
    await chooseGroup('Title')

    // Assert
    await waitFor(() => expect(lastInsightsRequest(fetchMock, 'by-dimension').get('dimension')).toBe('job_title'))
    expect(await within(section(SECTION)).findByRole('columnheader', { name: 'Title' })).toBeInTheDocument()
    expect(within(section(SECTION)).getByRole('row', { name: /Analyst/ })).toBeInTheDocument()
  })

  it('test_pay_by_dimension_local_currency_enabled_only_for_country', async () => {
    // Arrange
    mockInsightsApi()
    renderInsights()
    const region = await screen.findByRole('region', { name: SECTION })
    const enabledForCountry = within(region).getByRole('radio', { name: 'Local' })
    expect(enabledForCountry).toBeEnabled()

    // Act
    await chooseGroup('Department')

    // Assert
    expect(within(region).getByRole('radio', { name: 'Local' })).toBeDisabled()
    expect(within(region).getByRole('radio', { name: 'USD' })).toBeChecked()
  })

  it('test_pay_by_dimension_local_currency_shows_each_country_in_its_own_currency', async () => {
    // Arrange
    const fetchMock = mockInsightsApi()
    renderInsights()
    const region = await screen.findByRole('region', { name: SECTION })

    // Act
    await userEvent.click(within(region).getByRole('radio', { name: 'Local' }))

    // Assert
    await waitFor(() => expect(lastInsightsRequest(fetchMock, 'by-dimension').get('currency')).toBe('local'))
    const row = await within(region).findByRole('row', { name: /2,450,000 INR/ })
    expect(cellTexts(row)[0]).toBe('India')
  })

  it('test_pay_by_dimension_leaving_country_falls_back_to_usd', async () => {
    // Arrange
    const fetchMock = mockInsightsApi()
    renderInsights()
    const region = await screen.findByRole('region', { name: SECTION })
    await userEvent.click(within(region).getByRole('radio', { name: 'Local' }))

    // Act
    await chooseGroup('Department')

    // Assert
    await waitFor(() => expect(lastInsightsRequest(fetchMock, 'by-dimension').get('dimension')).toBe('department'))
    // The API rejects local currency for mixed-currency groups, so it must never be sent.
    expect(lastInsightsRequest(fetchMock, 'by-dimension').get('currency')).toBe('usd')
  })

  it('test_pay_by_dimension_shows_median_bar_chart_for_current_grouping', async () => {
    // Arrange
    mockInsightsApi()
    renderInsights()
    const region = await screen.findByRole('region', { name: SECTION })
    await within(region).findByRole('figure', { name: 'Median pay by country (USD)' })

    // Act
    await chooseGroup('Department')

    // Assert
    expect(await within(region).findByRole('figure', { name: 'Median pay by department (USD)' })).toBeInTheDocument()
  })
})
