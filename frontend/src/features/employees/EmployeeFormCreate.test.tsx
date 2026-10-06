import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fillEmployeeForm, formField, openAddEmployeeForm, saveForm, VALID_NEW_EMPLOYEE } from './formTesting'
import { employeeRequests, mockEmployeesApi, mutationRequests, renderEmployeesAt } from './testing'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('Employee form: create', () => {
  it('test_add_employee_button_opens_drawer_form', async () => {
    // Arrange
    const user = userEvent.setup()
    mockEmployeesApi()
    renderEmployeesAt('/employees')

    // Act
    const dialog = await openAddEmployeeForm(user)

    // Assert
    expect(dialog).toBeVisible()
    expect(within(dialog).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('test_employee_form_offers_country_and_department_from_meta_filters', async () => {
    // Arrange
    const user = userEvent.setup()
    mockEmployeesApi()
    renderEmployeesAt('/employees')

    // Act
    const dialog = await openAddEmployeeForm(user)

    // Assert
    expect(await within(formField(dialog, 'Country')).findByRole('option', { name: 'Germany' })).toBeInTheDocument()
    expect(within(formField(dialog, 'Department')).getByRole('option', { name: 'Finance' })).toBeInTheDocument()
  })

  it('test_employee_form_offers_every_supported_country_but_filter_only_staffed_ones', async () => {
    // Arrange
    const user = userEvent.setup()
    mockEmployeesApi()
    renderEmployeesAt('/employees')
    const countryFilter = screen.getByLabelText('Country')
    await within(countryFilter).findByRole('option', { name: 'India' })

    // Act
    const dialog = await openAddEmployeeForm(user)

    // Assert
    expect(await within(formField(dialog, 'Country')).findByRole('option', { name: 'Canada' })).toBeInTheDocument()
    expect(within(countryFilter).queryByRole('option', { name: 'Canada' })).not.toBeInTheDocument()
  })

  it('test_employee_form_flags_every_required_field_and_sends_nothing', async () => {
    // Arrange
    const user = userEvent.setup()
    const fetchMock = mockEmployeesApi()
    renderEmployeesAt('/employees')
    const dialog = await openAddEmployeeForm(user)

    // Act
    await saveForm(user, dialog)

    // Assert
    const required = ['First name', 'Last name', 'Email', 'Job title', 'Department', 'Country', 'Salary', 'Hire date']
    for (const label of required) {
      expect(formField(dialog, label)).toHaveAccessibleDescription('Required')
    }
    expect(mutationRequests(fetchMock)).toEqual([])
  })

  it('test_employee_form_rejects_invalid_email', async () => {
    // Arrange
    const user = userEvent.setup()
    const fetchMock = mockEmployeesApi()
    renderEmployeesAt('/employees')
    const dialog = await openAddEmployeeForm(user)
    await fillEmployeeForm(user, dialog, { ...VALID_NEW_EMPLOYEE, email: 'maya-at-acme' })

    // Act
    await saveForm(user, dialog)

    // Assert
    expect(formField(dialog, 'Email')).toHaveAccessibleDescription('Enter a valid email address')
    expect(mutationRequests(fetchMock)).toEqual([])
  })

  it('test_employee_form_rejects_salary_that_is_not_above_zero', async () => {
    // Arrange
    const user = userEvent.setup()
    const fetchMock = mockEmployeesApi()
    renderEmployeesAt('/employees')
    const dialog = await openAddEmployeeForm(user)
    await fillEmployeeForm(user, dialog, { ...VALID_NEW_EMPLOYEE, salary_amount: 0 })

    // Act
    await saveForm(user, dialog)

    // Assert
    expect(formField(dialog, 'Salary')).toHaveAccessibleDescription('Enter a whole number greater than 0')
    expect(mutationRequests(fetchMock)).toEqual([])
  })

  it('test_employee_form_shows_currency_read_only_following_country', async () => {
    // Arrange
    const user = userEvent.setup()
    mockEmployeesApi()
    renderEmployeesAt('/employees')
    const dialog = await openAddEmployeeForm(user)
    const country = formField(dialog, 'Country')
    await within(country).findByRole('option', { name: 'India' })

    // Act
    await user.selectOptions(country, 'India')
    const currencyForIndia = (formField(dialog, 'Currency') as HTMLInputElement).value
    await user.selectOptions(country, 'Germany')

    // Assert
    expect(currencyForIndia).toBe('INR')
    expect(formField(dialog, 'Currency')).toHaveValue('EUR')
    expect(formField(dialog, 'Currency')).toHaveAttribute('readonly')
  })

  it('test_employee_form_posts_api_fields_with_integer_salary', async () => {
    // Arrange
    const user = userEvent.setup()
    const fetchMock = mockEmployeesApi()
    renderEmployeesAt('/employees')
    const dialog = await openAddEmployeeForm(user)
    await fillEmployeeForm(user, dialog)

    // Act
    await saveForm(user, dialog)

    // Assert
    await waitFor(() => expect(mutationRequests(fetchMock)).toHaveLength(1))
    expect(mutationRequests(fetchMock)[0]).toEqual({ method: 'POST', path: '/api/employees', body: VALID_NEW_EMPLOYEE })
  })

  it('test_employee_form_success_closes_drawer_and_refreshes_list', async () => {
    // Arrange
    const user = userEvent.setup()
    const fetchMock = mockEmployeesApi()
    renderEmployeesAt('/employees')
    const dialog = await openAddEmployeeForm(user)
    await fillEmployeeForm(user, dialog)
    const listRequestsBeforeSave = employeeRequests(fetchMock).length

    // Act
    await saveForm(user, dialog)

    // Assert
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(employeeRequests(fetchMock).length).toBeGreaterThan(listRequestsBeforeSave))
  })

  it('test_employee_form_shows_duplicate_email_message_under_email', async () => {
    // Arrange
    const user = userEvent.setup()
    const detail = 'An employee with this email already exists'
    mockEmployeesApi({ mutationResponse: { status: 409, body: { detail } } })
    renderEmployeesAt('/employees')
    const dialog = await openAddEmployeeForm(user)
    await fillEmployeeForm(user, dialog)

    // Act
    await saveForm(user, dialog)

    // Assert
    await waitFor(() => expect(formField(dialog, 'Email')).toHaveAccessibleDescription(detail))
    expect(screen.getByRole('dialog', { name: 'Add employee' })).toBeInTheDocument()
  })

  it('test_employee_form_shows_422_field_errors_under_their_fields', async () => {
    // Arrange
    const user = userEvent.setup()
    const detail = [
      { loc: ['body', 'hire_date'], msg: 'Input should be a valid date' },
      { loc: ['body', 'email'], msg: 'value is not a valid email address' },
    ]
    mockEmployeesApi({ mutationResponse: { status: 422, body: { detail } } })
    renderEmployeesAt('/employees')
    const dialog = await openAddEmployeeForm(user)
    await fillEmployeeForm(user, dialog)

    // Act
    await saveForm(user, dialog)

    // Assert
    await waitFor(() => expect(formField(dialog, 'Hire date')).toHaveAccessibleDescription('Input should be a valid date'))
    expect(formField(dialog, 'Email')).toHaveAccessibleDescription('value is not a valid email address')
  })
})
