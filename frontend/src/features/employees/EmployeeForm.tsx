import type { ReactNode } from 'react'
import type { Employee, FilterOptions } from '@/api/employees'
import { Button } from '@/components/ui/button'
import { SheetClose } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { EmployeeFormErrors, EmployeeFormField, EmployeeFormValues } from './employeeFormModel'
import { CONTROL_CLASS, FormField, OptionList } from './formControls'
import { useFilterOptions } from './hooks'
import { useEmployeeForm } from './useEmployeeForm'

interface FormBinding {
  values: EmployeeFormValues
  errors: EmployeeFormErrors
  setField: (field: EmployeeFormField, value: string) => void
}

interface FieldProps {
  form: FormBinding
  field: EmployeeFormField
  label: string
  className?: string
}

function TextField({ form, field, label, className, type = 'text' }: FieldProps & { type?: string }) {
  const isMoney = field === 'salary_amount'
  return (
    <FormField id={`employee-${field}`} label={label} error={form.errors[field]} className={className}>
      {(control) => (
        <input {...control} type={type} value={form.values[field]} inputMode={isMoney ? 'numeric' : undefined}
          onChange={(event) => form.setField(field, event.target.value)}
          className={cn(CONTROL_CLASS, isMoney && 'text-right tabular-nums')} />
      )}
    </FormField>
  )
}

function SelectField({ form, field, label, options }: FieldProps & { options: string[] }) {
  return (
    <FormField id={`employee-${field}`} label={label} error={form.errors[field]}>
      {(control) => (
        <select {...control} value={form.values[field]} onChange={(event) => form.setField(field, event.target.value)}
          className={CONTROL_CLASS}>
          <OptionList placeholder="Select…" options={options} />
        </select>
      )}
    </FormField>
  )
}

function CurrencyField({ currency }: { currency: string }) {
  // Derived from country on the server (D-003), so it is shown but never edited.
  return (
    <FormField id="employee-currency" label="Currency">
      {(control) => <input {...control} readOnly value={currency} placeholder="—" className={CONTROL_CLASS} />}
    </FormField>
  )
}

function EmployeeFormFields({ form, options }: { form: FormBinding; options: FilterOptions | undefined }) {
  const currencyByCountry = options?.currency_by_country ?? {}
  return (
    <div className="grid grid-cols-2 content-start gap-x-3 gap-y-4 overflow-y-auto px-4 py-4">
      <TextField form={form} field="first_name" label="First name" />
      <TextField form={form} field="last_name" label="Last name" />
      <TextField form={form} field="email" label="Email" type="email" className="col-span-2" />
      <TextField form={form} field="job_title" label="Job title" />
      <SelectField form={form} field="department" label="Department" options={options?.departments ?? []} />
      <SelectField form={form} field="country" label="Country" options={Object.keys(currencyByCountry).sort()} />
      <CurrencyField currency={currencyByCountry[form.values.country] ?? ''} />
      <TextField form={form} field="salary_amount" label="Salary" type="number" />
      <TextField form={form} field="hire_date" label="Hire date" type="date" />
    </div>
  )
}

interface EmployeeFormProps {
  employee: Employee | null
  onSaved: () => void
  footerStart?: ReactNode
}

export function EmployeeForm({ employee, onSaved, footerStart }: EmployeeFormProps) {
  const form = useEmployeeForm(employee, onSaved)
  const { data: options } = useFilterOptions()
  return (
    <form noValidate onSubmit={form.submit} className="flex min-h-0 flex-1 flex-col">
      <EmployeeFormFields form={form} options={options} />
      {form.errors.form && <p role="alert" className="mx-4 border-l-2 border-destructive px-3 py-2 text-sm">{form.errors.form}</p>}
      <div className="mt-auto flex items-center gap-2 border-t px-4 py-3">
        {footerStart}
        <SheetClose asChild>
          <Button type="button" variant="outline" className="ml-auto">Cancel</Button>
        </SheetClose>
        <Button type="submit" disabled={form.isSaving}>{form.isSaving ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  )
}
