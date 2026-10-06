import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { formField, openEditEmployeeForm, saveForm } from './formTesting'
import { employeeRequests, mockEmployeesApi, mutationRequests, renderEmployeesAt } from './testing'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('Employee form: edit and delete', () => {
  it('test_clicking_row_opens_edit_form_prefilled', async () => {
    // Arrange
    const user = userEvent.setup()
    mockEmployeesApi()
    renderEmployeesAt('/employees')

    // Act
    const dialog = await openEditEmployeeForm(user, /EMP-00001/)

    // Assert
    expect(formField(dialog, 'First name')).toHaveValue('Asha')
    expect(formField(dialog, 'Last name')).toHaveValue('Rao')
    expect(formField(dialog, 'Email')).toHaveValue('employee1@acme.test')
    expect(formField(dialog, 'Job title')).toHaveValue('Senior Engineer')
    expect(formField(dialog, 'Salary')).toHaveValue(2450000)
    expect(formField(dialog, 'Hire date')).toHaveValue('2021-04-01')
    await waitFor(() => expect(formField(dialog, 'Country')).toHaveValue('India'))
    expect(formField(dialog, 'Department')).toHaveValue('Engineering')
    expect(formField(dialog, 'Currency')).toHaveValue('INR')
  })

  it('test_edit_form_patches_the_employee', async () => {
    // Arrange
    const user = userEvent.setup()
    const fetchMock = mockEmployeesApi()
    renderEmployeesAt('/employees')
    const dialog = await openEditEmployeeForm(user, /EMP-00001/)
    const salary = formField(dialog, 'Salary')
    await user.clear(salary)
    await user.type(salary, '2600000')

    // Act
    await saveForm(user, dialog)

    // Assert
    await waitFor(() => expect(mutationRequests(fetchMock)).toHaveLength(1))
    const [request] = mutationRequests(fetchMock)
    expect(request).toMatchObject({ method: 'PATCH', path: '/api/employees/1', body: { salary_amount: 2600000 } })
  })

  it('test_edit_form_success_closes_drawer_and_refreshes_list', async () => {
    // Arrange
    const user = userEvent.setup()
    const fetchMock = mockEmployeesApi()
    renderEmployeesAt('/employees')
    const dialog = await openEditEmployeeForm(user, /EMP-00001/)
    const listRequestsBeforeSave = employeeRequests(fetchMock).length

    // Act
    await saveForm(user, dialog)

    // Assert
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(employeeRequests(fetchMock).length).toBeGreaterThan(listRequestsBeforeSave))
  })

  it('test_delete_asks_for_confirmation_before_sending', async () => {
    // Arrange
    const user = userEvent.setup()
    const fetchMock = mockEmployeesApi()
    renderEmployeesAt('/employees')
    const dialog = await openEditEmployeeForm(user, /EMP-00001/)

    // Act
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    // Assert
    expect(await screen.findByRole('alertdialog', { name: 'Delete Asha Rao?' })).toBeInTheDocument()
    expect(mutationRequests(fetchMock)).toEqual([])
  })

  it('test_confirming_delete_removes_employee_closes_drawer_and_refreshes_list', async () => {
    // Arrange
    const user = userEvent.setup()
    const fetchMock = mockEmployeesApi()
    renderEmployeesAt('/employees')
    const dialog = await openEditEmployeeForm(user, /EMP-00001/)
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Delete Asha Rao?' })
    const listRequestsBeforeDelete = employeeRequests(fetchMock).length

    // Act
    await user.click(within(confirm).getByRole('button', { name: 'Delete employee' }))

    // Assert
    await waitFor(() => expect(mutationRequests(fetchMock)).toEqual([
      { method: 'DELETE', path: '/api/employees/1', body: undefined },
    ]))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(employeeRequests(fetchMock).length).toBeGreaterThan(listRequestsBeforeDelete))
  })

  it('test_cancelling_delete_sends_nothing_and_keeps_form_open', async () => {
    // Arrange
    const user = userEvent.setup()
    const fetchMock = mockEmployeesApi()
    renderEmployeesAt('/employees')
    const dialog = await openEditEmployeeForm(user, /EMP-00001/)
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Delete Asha Rao?' })

    // Act
    await user.click(within(confirm).getByRole('button', { name: 'Cancel' }))

    // Assert
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.getByRole('dialog', { name: 'Edit employee' })).toBeInTheDocument()
    expect(mutationRequests(fetchMock)).toEqual([])
  })
})
