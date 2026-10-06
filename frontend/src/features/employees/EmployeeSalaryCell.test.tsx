import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EMPLOYEES, employeePage, mockEmployeesApi, renderEmployeesAt } from './testing'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

async function findSalaryCell(code: string): Promise<HTMLElement> {
  const row = await screen.findByRole('row', { name: new RegExp(code) })
  return within(row).getAllByRole('cell')[5]
}

describe('Employee salary cell', () => {
  it('test_salary_cell_shows_amount_then_iso_code', async () => {
    // Arrange
    mockEmployeesApi()

    // Act
    renderEmployeesAt('/employees')

    // Assert
    expect(within(await findSalaryCell('EMP-00001')).getByText('2,450,000 INR')).toBeInTheDocument()
    expect(within(await findSalaryCell('EMP-00002')).getByText('185,000 USD')).toBeInTheDocument()
    expect(within(await findSalaryCell('EMP-00003')).getByText('72,000 EUR')).toBeInTheDocument()
  })

  it('test_salary_cell_never_uses_currency_symbols', async () => {
    // Arrange
    mockEmployeesApi()

    // Act
    renderEmployeesAt('/employees')

    // Assert
    await screen.findByRole('row', { name: /EMP-00001/ })
    expect(screen.getByRole('table')).not.toHaveTextContent(/[₹$€£]/)
  })

  it('test_salary_cell_shows_usd_equivalent_beneath_amount', async () => {
    // Arrange
    mockEmployeesApi()

    // Act
    renderEmployeesAt('/employees')

    // Assert
    expect(within(await findSalaryCell('EMP-00001')).getByText('≈ 27,841 USD')).toBeInTheDocument()
    expect(within(await findSalaryCell('EMP-00003')).getByText('≈ 83,721 USD')).toBeInTheDocument()
  })

  it('test_salary_cell_usd_equivalent_comes_from_api_not_a_frontend_rate', async () => {
    // Arrange: a value no rate table would produce, so only the API field can explain it
    const employee = { ...EMPLOYEES[0], salary_usd_equivalent: 12345 }
    mockEmployeesApi({ page: employeePage({ items: [employee], total: 1 }) })

    // Act
    renderEmployeesAt('/employees')

    // Assert
    expect(within(await findSalaryCell('EMP-00001')).getByText('≈ 12,345 USD')).toBeInTheDocument()
  })

  it('test_salary_cell_shows_no_usd_equivalent_when_paid_in_usd', async () => {
    // Arrange
    mockEmployeesApi()

    // Act
    renderEmployeesAt('/employees')

    // Assert
    const salaryCell = await findSalaryCell('EMP-00002')
    expect(within(salaryCell).getByText('185,000 USD')).toBeInTheDocument()
    expect(within(salaryCell).queryByText(/≈/)).not.toBeInTheDocument()
  })

  it('test_salary_cell_uses_tabular_numbers', async () => {
    // Arrange
    mockEmployeesApi()

    // Act
    renderEmployeesAt('/employees')

    // Assert
    expect(await findSalaryCell('EMP-00001')).toHaveClass('tabular-nums')
  })
})
