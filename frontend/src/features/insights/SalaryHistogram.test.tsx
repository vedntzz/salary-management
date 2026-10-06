import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { insightsRequests, lastInsightsRequest, mockInsightsApi, renderInsights } from './testing'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const SECTION = 'Salary distribution'

async function findCountrySelect(): Promise<HTMLElement> {
  const region = await screen.findByRole('region', { name: SECTION })
  const select = within(region).getByLabelText('Country')
  await within(select).findByRole('option', { name: 'India' })
  return select
}

describe('Salary distribution', () => {
  it('test_distribution_country_select_offers_all_countries_then_each_country', async () => {
    // Arrange
    mockInsightsApi()

    // Act
    renderInsights()

    // Assert
    const select = await findCountrySelect()
    const options = within(select).getAllByRole('option').map((option) => option.textContent)
    expect(options).toEqual(['All countries', 'Germany', 'India', 'United States'])
  })

  it('test_distribution_all_countries_requests_without_country_and_reports_usd', async () => {
    // Arrange
    const fetchMock = mockInsightsApi()

    // Act
    renderInsights()

    // Assert
    const region = await screen.findByRole('region', { name: SECTION })
    expect(await within(region).findByRole('figure', { name: 'Salary distribution, all countries (USD)' })).toBeInTheDocument()
    expect(insightsRequests(fetchMock, 'distribution').every((params) => !params.has('country'))).toBe(true)
  })

  it('test_distribution_choosing_country_reports_in_local_currency', async () => {
    // Arrange
    const fetchMock = mockInsightsApi()
    renderInsights()
    const select = await findCountrySelect()

    // Act
    await userEvent.selectOptions(select, 'India')

    // Assert
    await waitFor(() => expect(lastInsightsRequest(fetchMock, 'distribution').get('country')).toBe('India'))
    const region = screen.getByRole('region', { name: SECTION })
    expect(await within(region).findByRole('figure', { name: 'Salary distribution, India (INR)' })).toBeInTheDocument()
  })

  it('test_distribution_shows_empty_state_when_no_salaries', async () => {
    // Arrange
    mockInsightsApi({ replies: { distribution: { currency: 'USD', bins: [] } } })

    // Act
    renderInsights()

    // Assert
    const region = await screen.findByRole('region', { name: SECTION })
    expect(await within(region).findByText(/no salaries to show/i)).toBeInTheDocument()
    expect(within(region).queryByRole('figure')).not.toBeInTheDocument()
  })
})
