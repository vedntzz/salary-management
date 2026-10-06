import type { Employee } from '@/api/employees'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DeleteEmployeeButton } from './DeleteEmployeeButton'
import { EmployeeForm } from './EmployeeForm'

export type EmployeeDrawerTarget = { mode: 'create' } | { mode: 'edit'; employee: Employee }

interface EmployeeDrawerProps {
  target: EmployeeDrawerTarget | null
  onClose: () => void
}

export function EmployeeDrawer({ target, onClose }: EmployeeDrawerProps) {
  const employee = target?.mode === 'edit' ? target.employee : null
  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{employee ? 'Edit employee' : 'Add employee'}</SheetTitle>
          <SheetDescription>
            {employee ? employee.employee_code : 'Salary is entered in the currency of the employee’s country.'}
          </SheetDescription>
        </SheetHeader>
        {/* Keyed so switching employees starts from fresh form state. */}
        <EmployeeForm key={employee?.id ?? 'new'} employee={employee} onSaved={onClose}
          footerStart={employee && <DeleteEmployeeButton employee={employee} onDeleted={onClose} />} />
      </SheetContent>
    </Sheet>
  )
}
