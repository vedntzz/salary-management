import { useState, type FormEvent } from 'react'
import type { Employee } from '@/api/employees'
import {
  EMPTY_FORM_VALUES,
  toEmployeeFields,
  toFormErrors,
  toFormValues,
  validateEmployeeForm,
  type EmployeeFormErrors,
  type EmployeeFormField,
} from './employeeFormModel'
import { useSaveEmployee } from './hooks'

function useFormValues(employee: Employee | null) {
  const [values, setValues] = useState(() => (employee ? toFormValues(employee) : EMPTY_FORM_VALUES))
  const setField = (field: EmployeeFormField, value: string) =>
    setValues((current) => ({ ...current, [field]: value }))
  return { values, setField }
}

export function useEmployeeForm(employee: Employee | null, onSaved: () => void) {
  const { values, setField } = useFormValues(employee)
  const [errors, setErrors] = useState<EmployeeFormErrors>({})
  const save = useSaveEmployee(employee?.id ?? null)

  function submit(event: FormEvent) {
    event.preventDefault()
    const clientErrors = validateEmployeeForm(values)
    setErrors(clientErrors)
    // Catch what we can before the round trip; the server still has the final say.
    if (Object.keys(clientErrors).length > 0) return
    save.mutate(toEmployeeFields(values), {
      onSuccess: onSaved,
      onError: (error) => setErrors(toFormErrors(error)),
    })
  }

  return { values, errors, setField, submit, isSaving: save.isPending }
}
