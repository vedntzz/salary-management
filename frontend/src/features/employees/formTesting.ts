import { screen, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

export const VALID_NEW_EMPLOYEE = {
  first_name: 'Maya',
  last_name: 'Iyer',
  email: 'maya.iyer@acme.test',
  job_title: 'Analyst',
  department: 'Finance',
  country: 'India',
  salary_amount: 1800000,
  hire_date: '2024-03-01',
}

export function formField(dialog: HTMLElement, label: string): HTMLElement {
  return within(dialog).getByLabelText(label)
}

export async function openAddEmployeeForm(user: UserEvent): Promise<HTMLElement> {
  await screen.findByRole('row', { name: /EMP-00001/ })
  await user.click(screen.getByRole('button', { name: 'Add employee' }))
  return screen.findByRole('dialog', { name: 'Add employee' })
}

export async function openEditEmployeeForm(user: UserEvent, rowName: RegExp): Promise<HTMLElement> {
  await user.click(await screen.findByRole('row', { name: rowName }))
  return screen.findByRole('dialog', { name: 'Edit employee' })
}

export async function fillEmployeeForm(user: UserEvent, dialog: HTMLElement, values = VALID_NEW_EMPLOYEE) {
  await user.type(formField(dialog, 'First name'), values.first_name)
  await user.type(formField(dialog, 'Last name'), values.last_name)
  await user.type(formField(dialog, 'Email'), values.email)
  await user.type(formField(dialog, 'Job title'), values.job_title)
  // Country and department options arrive from /api/meta/filters.
  await within(formField(dialog, 'Country')).findByRole('option', { name: values.country })
  await user.selectOptions(formField(dialog, 'Department'), values.department)
  await user.selectOptions(formField(dialog, 'Country'), values.country)
  await user.type(formField(dialog, 'Salary'), String(values.salary_amount))
  await user.type(formField(dialog, 'Hire date'), values.hire_date)
}

export async function saveForm(user: UserEvent, dialog: HTMLElement) {
  await user.click(within(dialog).getByRole('button', { name: 'Save' }))
}
