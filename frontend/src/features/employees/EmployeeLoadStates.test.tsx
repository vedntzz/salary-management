import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockEmployeesApi, renderEmployeesAt } from './testing'

const SERVER_ERROR = { status: 500, detail: 'Database unavailable' }
const WAKING_MESSAGE = 'Waking up the server, this can take up to a minute on the free tier.'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('Employee load states', () => {
  it('test_employee_list_shows_server_message_when_request_fails', async () => {
    // Arrange
    mockEmployeesApi({ employeesError: SERVER_ERROR })

    // Act
    renderEmployeesAt('/employees')

    // Assert
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Database unavailable')
  })

  it('test_employee_list_never_shows_empty_state_when_request_fails', async () => {
    // Arrange
    mockEmployeesApi({ employeesError: SERVER_ERROR })

    // Act
    renderEmployeesAt('/employees')

    // Assert
    await screen.findByRole('alert')
    expect(screen.queryByText(/no employees match/i)).not.toBeInTheDocument()
  })

  it('test_employee_list_retry_button_reloads_after_failure', async () => {
    // Arrange
    mockEmployeesApi({ employeesError: SERVER_ERROR })
    renderEmployeesAt('/employees')
    const retry = await screen.findByRole('button', { name: 'Retry' })
    mockEmployeesApi()

    // Act
    await userEvent.click(retry)

    // Assert
    expect(await screen.findByRole('row', { name: /EMP-00001/ })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('test_employee_list_shows_wake_up_notice_only_after_3s_of_first_load', async () => {
    // Arrange
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    mockEmployeesApi({ employeesPending: true })

    // Act
    renderEmployeesAt('/employees')
    await act(() => vi.advanceTimersByTimeAsync(2999))
    const shownEarly = screen.queryByText(WAKING_MESSAGE) !== null
    await act(() => vi.advanceTimersByTimeAsync(1))

    // Assert
    expect(shownEarly).toBe(false)
    expect(screen.getByText(WAKING_MESSAGE)).toBeInTheDocument()
  })
})
