import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { openAddEmployeeForm, openEditEmployeeForm, saveForm } from './formTesting'
import { EMPLOYEES, employeePage, mockEmployeesApi, renderEmployeesAt } from './testing'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('Employee dialogs: focus', () => {
  it('test_closing_add_drawer_returns_focus_to_add_employee_button', async () => {
    // Arrange
    const user = userEvent.setup()
    mockEmployeesApi()
    renderEmployeesAt('/employees')
    const dialog = await openAddEmployeeForm(user)

    // Act
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    // Assert
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add employee' })).toHaveFocus())
  })

  it('test_closing_delete_confirm_returns_focus_to_delete_button', async () => {
    // Arrange
    const user = userEvent.setup()
    mockEmployeesApi()
    renderEmployeesAt('/employees')
    const dialog = await openEditEmployeeForm(user, /EMP-00001/)
    const deleteButton = within(dialog).getByRole('button', { name: 'Delete' })
    await user.click(deleteButton)
    const confirm = await screen.findByRole('alertdialog', { name: 'Delete Asha Rao?' })

    // Act
    await user.click(within(confirm).getByRole('button', { name: 'Cancel' }))

    // Assert
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    await waitFor(() => expect(deleteButton).toHaveFocus())
  })

  it('test_saving_edit_returns_focus_to_same_employee_after_list_reorders', async () => {
    // Arrange
    const user = userEvent.setup()
    mockEmployeesApi()
    renderEmployeesAt('/employees')
    const dialog = await openEditEmployeeForm(user, /EMP-00001/)
    // After the save the list comes back in a new order, with Asha last instead of first.
    mockEmployeesApi({ page: employeePage({ items: [EMPLOYEES[1], EMPLOYEES[2], EMPLOYEES[0]] }) })

    // Act
    await saveForm(user, dialog)

    // Assert
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole('row', { name: /EMP-00001/ })).toHaveFocus())
  })
})
