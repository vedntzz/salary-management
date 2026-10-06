import { ApiError } from '@/api/client'
import type { Employee, EmployeeFields } from '@/api/employees'

// Inputs hold strings; conversion to API types happens once, in toEmployeeFields.
export type EmployeeFormValues = Record<keyof EmployeeFields, string>
export type EmployeeFormField = keyof EmployeeFormValues
export type EmployeeFormErrors = Partial<Record<EmployeeFormField | 'form', string>>

export const FORM_FIELDS: EmployeeFormField[] = [
  'first_name', 'last_name', 'email', 'job_title', 'department', 'country', 'salary_amount', 'hire_date',
]

export const EMPTY_FORM_VALUES: EmployeeFormValues = {
  first_name: '', last_name: '', email: '', job_title: '',
  department: '', country: '', salary_amount: '', hire_date: '',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const POSITIVE_WHOLE_NUMBER = /^[1-9]\d*$/

export function toFormValues(employee: Employee): EmployeeFormValues {
  const values = { ...EMPTY_FORM_VALUES }
  for (const field of FORM_FIELDS) values[field] = String(employee[field])
  return values
}

function validateField(field: EmployeeFormField, value: string): string | undefined {
  if (!value.trim()) return 'Required'
  if (field === 'email' && !EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address'
  if (field === 'salary_amount' && !POSITIVE_WHOLE_NUMBER.test(value)) return 'Enter a whole number greater than 0'
  return undefined
}

export function validateEmployeeForm(values: EmployeeFormValues): EmployeeFormErrors {
  const errors: EmployeeFormErrors = {}
  for (const field of FORM_FIELDS) {
    const error = validateField(field, values[field])
    if (error) errors[field] = error
  }
  return errors
}

export function toEmployeeFields(values: EmployeeFormValues): EmployeeFields {
  const trimmed = { ...values }
  for (const field of FORM_FIELDS) trimmed[field] = values[field].trim()
  return { ...trimmed, salary_amount: Number(trimmed.salary_amount) }
}

function pickFormFieldErrors(fieldErrors: Record<string, string>): EmployeeFormErrors {
  const errors: EmployeeFormErrors = {}
  for (const field of FORM_FIELDS) {
    if (fieldErrors[field]) errors[field] = fieldErrors[field]
  }
  return errors
}

export function toFormErrors(error: unknown): EmployeeFormErrors {
  if (error instanceof ApiError && error.status === 409) return { email: error.message }
  if (error instanceof ApiError) {
    const fieldErrors = pickFormFieldErrors(error.fieldErrors)
    // A 422 about something that isn't a form field still needs to be visible.
    return Object.keys(fieldErrors).length > 0 ? fieldErrors : { form: error.message }
  }
  return { form: error instanceof Error ? error.message : 'Something went wrong. Try again.' }
}
