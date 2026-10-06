import type { Employee } from '@/api/employees'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useDeleteEmployee } from './hooks'

function ConfirmDeleteContent({ employee, onConfirm }: { employee: Employee; onConfirm: () => void }) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{`Delete ${employee.first_name} ${employee.last_name}?`}</AlertDialogTitle>
        <AlertDialogDescription>
          {`${employee.employee_code} will be removed permanently. This can't be undone.`}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction variant="destructive" onClick={onConfirm}>
          Delete employee
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}

interface DeleteEmployeeButtonProps {
  employee: Employee
  onDeleted: () => void
}

export function DeleteEmployeeButton({ employee, onDeleted }: DeleteEmployeeButtonProps) {
  const remove = useDeleteEmployee()
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" disabled={remove.isPending}>Delete</Button>
      </AlertDialogTrigger>
      <ConfirmDeleteContent employee={employee} onConfirm={() => remove.mutate(employee.id, { onSuccess: onDeleted })} />
      {remove.error && <p role="alert" className="text-xs text-destructive">{remove.error.message}</p>}
    </AlertDialog>
  )
}
