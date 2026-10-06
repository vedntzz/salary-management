import { act, configure, getConfig, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  currentUrlParams,
  employeeRequests,
  lastEmployeeRequest,
  mockEmployeesApi,
  renderEmployeesAt,
} from './testing'

const defaultAsyncWrapper = getConfig().asyncWrapper

afterEach(() => {
  configure({ asyncWrapper: defaultAsyncWrapper })
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('Employee filters', () => {
  it('test_filters_offer_options_from_meta_filters', async () => {
    // Arrange
    mockEmployeesApi()

    // Act
    renderEmployeesAt('/employees')

    // Assert
    expect(await within(screen.getByLabelText('Country')).findByRole('option', { name: 'India' })).toBeInTheDocument()
    expect(within(screen.getByLabelText('Department')).getByRole('option', { name: 'Finance' })).toBeInTheDocument()
    expect(within(screen.getByLabelText('Title')).getByRole('option', { name: 'Analyst' })).toBeInTheDocument()
  })

  it('test_filters_changing_a_filter_resets_page_to_one', async () => {
    // Arrange
    const fetchMock = mockEmployeesApi()
    renderEmployeesAt('/employees?page=3')
    const country = screen.getByLabelText('Country')
    await within(country).findByRole('option', { name: 'India' })

    // Act
    await userEvent.selectOptions(country, 'India')

    // Assert
    await waitFor(() => expect(lastEmployeeRequest(fetchMock).get('country')).toBe('India'))
    expect(lastEmployeeRequest(fetchMock).get('page')).toBe('1')
    expect(currentUrlParams().get('country')).toBe('India')
    expect(currentUrlParams().get('page')).toBeNull()
  })

  it('test_search_sends_request_only_after_300ms_debounce', async () => {
    // Arrange
    const fetchMock = mockEmployeesApi()
    renderEmployeesAt('/employees')
    await screen.findByRole('row', { name: /EMP-00001/ })
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    // RTL's wrapper drains on a setTimeout it only advances for Jest timers, so it hangs under Vitest's.
    configure({ asyncWrapper: (callback) => callback() })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    // Act
    await user.type(screen.getByRole('searchbox', { name: 'Search employees' }), 'asha')
    await act(() => vi.advanceTimersByTimeAsync(299))
    const searchedBeforeDebounce = employeeRequests(fetchMock).some((params) => params.has('search'))
    await act(() => vi.advanceTimersByTimeAsync(1))

    // Assert
    expect(searchedBeforeDebounce).toBe(false)
    await waitFor(() => expect(lastEmployeeRequest(fetchMock).get('search')).toBe('asha'))
    const searchedTerms = employeeRequests(fetchMock).map((params) => params.get('search')).filter(Boolean)
    expect(searchedTerms).toEqual(['asha'])
  })

  it('test_search_writes_term_to_url_and_resets_page', async () => {
    // Arrange
    mockEmployeesApi()
    renderEmployeesAt('/employees?page=3')

    // Act
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search employees' }), 'asha')

    // Assert
    await waitFor(() => expect(currentUrlParams().get('search')).toBe('asha'))
    expect(currentUrlParams().get('page')).toBeNull()
  })

  it('test_filters_read_initial_state_from_url', async () => {
    // Arrange
    const fetchMock = mockEmployeesApi()
    const query = 'search=asha&country=India&department=Engineering&job_title=Engineer&sort=-salary&page=2'

    // Act
    renderEmployeesAt(`/employees?${query}`)

    // Assert
    await waitFor(() => expect(employeeRequests(fetchMock)).not.toHaveLength(0))
    const request = employeeRequests(fetchMock)[0]
    expect(Object.fromEntries(request)).toMatchObject({
      search: 'asha', country: 'India', department: 'Engineering',
      job_title: 'Engineer', sort: '-salary', page: '2',
    })
    expect(screen.getByRole('searchbox', { name: 'Search employees' })).toHaveValue('asha')
  })
})
