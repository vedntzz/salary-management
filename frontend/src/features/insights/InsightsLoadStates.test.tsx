import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockInsightsApi, renderInsights } from './testing'

const WAKING_MESSAGE = 'Waking up the server, this can take up to a minute on the free tier.'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('Insights load states', () => {
  it('test_insights_sections_show_loading_text_while_fetching', async () => {
    // Arrange
    mockInsightsApi({ pending: true })

    // Act
    renderInsights()

    // Assert
    for (const name of ['Pay by group', 'Salary distribution', 'Outliers']) {
      const region = await screen.findByRole('region', { name })
      expect(within(region).getByText(/loading/i)).toBeInTheDocument()
    }
  })

  it('test_insights_failed_section_shows_server_message_and_others_still_render', async () => {
    // Arrange
    mockInsightsApi({ failing: { outliers: 'Database unavailable' } })

    // Act
    renderInsights()

    // Assert
    const outliers = await screen.findByRole('region', { name: 'Outliers' })
    expect(await within(outliers).findByRole('alert')).toHaveTextContent('Database unavailable')
    const groups = screen.getByRole('region', { name: 'Pay by group' })
    expect(await within(groups).findByRole('table')).toBeInTheDocument()
  })

  it('test_insights_retry_button_reloads_failed_section', async () => {
    // Arrange
    mockInsightsApi({ failing: { outliers: 'Database unavailable' } })
    renderInsights()
    const outliers = await screen.findByRole('region', { name: 'Outliers' })
    const retry = await within(outliers).findByRole('button', { name: 'Retry' })
    mockInsightsApi()

    // Act
    await userEvent.click(retry)

    // Assert
    expect(await within(outliers).findByRole('link', { name: 'Asha Rao' })).toBeInTheDocument()
    expect(within(outliers).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('test_insights_shows_one_wake_up_notice_only_after_3s_of_first_load', async () => {
    // Arrange
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    mockInsightsApi({ pending: true })

    // Act
    renderInsights()
    await act(() => vi.advanceTimersByTimeAsync(2999))
    const shownEarly = screen.queryByText(WAKING_MESSAGE) !== null
    await act(() => vi.advanceTimersByTimeAsync(1))

    // Assert
    expect(shownEarly).toBe(false)
    expect(screen.getAllByText(WAKING_MESSAGE)).toHaveLength(1)
  })
})
