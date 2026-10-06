import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  currentUrlParams,
  employeePage,
  lastEmployeeRequest,
  mockEmployeesApi,
  renderEmployeesAt,
} from './testing'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

function cellTexts(row: HTMLElement): string[] {
  return within(row).getAllByRole('cell').map((cell) => cell.textContent ?? '')
}

describe('Employee table', () => {
  it('test_employee_table_shows_column_headers', async () => {
    // Arrange
    mockEmployeesApi()

    // Act
    renderEmployeesAt('/employees')

    // Assert
    const headers = await screen.findAllByRole('columnheader')
    expect(headers.map((header) => header.textContent)).toEqual([
      'Code', 'Name', 'Title', 'Department', 'Country', 'Salary',
    ])
  })

  it('test_employee_table_shows_one_row_per_employee_with_local_currency_salary', async () => {
    // Arrange
    mockEmployeesApi()

    // Act
    renderEmployeesAt('/employees')

    // Assert
    const row = await screen.findByRole('row', { name: /EMP-00001/ })
    expect(cellTexts(row)).toEqual([
      'EMP-00001', 'Asha Rao', 'Senior Engineer', 'Engineering', 'India', '₹2,450,000',
    ])
    expect(cellTexts(screen.getByRole('row', { name: /EMP-00002/ }))[5]).toBe('$185,000')
    expect(cellTexts(screen.getByRole('row', { name: /EMP-00003/ }))[5]).toBe('€72,000')
  })

  it('test_employee_table_salary_cell_uses_tabular_numbers', async () => {
    // Arrange
    mockEmployeesApi()

    // Act
    renderEmployeesAt('/employees')

    // Assert
    const row = await screen.findByRole('row', { name: /EMP-00001/ })
    expect(within(row).getByRole('cell', { name: '₹2,450,000' })).toHaveClass('tabular-nums')
  })

  it('test_employee_table_sort_header_toggles_ascending_then_descending', async () => {
    // Arrange
    const fetchMock = mockEmployeesApi()
    renderEmployeesAt('/employees')
    const nameHeader = await screen.findByRole('button', { name: 'Name' })

    // Act
    await userEvent.click(nameHeader)
    await waitFor(() => expect(lastEmployeeRequest(fetchMock).get('sort')).toBe('name'))
    await userEvent.click(screen.getByRole('button', { name: 'Name' }))

    // Assert
    await waitFor(() => expect(lastEmployeeRequest(fetchMock).get('sort')).toBe('-name'))
    expect(currentUrlParams().get('sort')).toBe('-name')
  })

  it('test_employee_table_marks_sorted_column_with_aria_sort', async () => {
    // Arrange
    mockEmployeesApi()

    // Act
    renderEmployeesAt('/employees?sort=-salary')

    // Assert
    const salaryHeader = await screen.findByRole('columnheader', { name: 'Salary' })
    expect(salaryHeader).toHaveAttribute('aria-sort', 'descending')
  })

  it('test_employee_table_shows_range_and_total_for_current_page', async () => {
    // Arrange
    mockEmployeesApi({ page: employeePage({ total: 45, page: 3 }) })

    // Act
    renderEmployeesAt('/employees?page=3')

    // Assert
    expect(await screen.findByText('41–45 of 45')).toBeInTheDocument()
  })

  it('test_employee_table_next_page_requests_and_writes_next_page', async () => {
    // Arrange
    const fetchMock = mockEmployeesApi({ page: employeePage({ total: 45 }) })
    renderEmployeesAt('/employees')
    await screen.findByText('1–20 of 45')

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))

    // Assert
    await waitFor(() => expect(lastEmployeeRequest(fetchMock).get('page')).toBe('2'))
    expect(currentUrlParams().get('page')).toBe('2')
  })

  it('test_employee_table_shows_loading_state_while_fetching', async () => {
    // Arrange
    mockEmployeesApi({ employeesPending: true })

    // Act
    renderEmployeesAt('/employees')

    // Assert
    expect(await screen.findByText(/loading employees/i)).toBeInTheDocument()
  })

  it('test_employee_table_shows_empty_state_when_no_employees_match', async () => {
    // Arrange
    mockEmployeesApi({ page: employeePage({ items: [], total: 0 }) })

    // Act
    renderEmployeesAt('/employees?search=nobody')

    // Assert
    expect(await screen.findByText(/no employees match/i)).toBeInTheDocument()
  })
})
