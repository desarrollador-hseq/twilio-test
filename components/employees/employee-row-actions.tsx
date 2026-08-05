"use client"

import { useTransition } from "react"
import Link from "next/link"
import { Pencil, Trash2, UserCheck, UserX } from "lucide-react"

import {
  deleteEmployee,
  toggleEmployeeActive,
} from "@/lib/actions/employees"
import { Button } from "@/components/ui/button"

export function EmployeeRowActions({
  companyId,
  employeeId,
  active,
}: {
  companyId: number
  employeeId: number
  active: boolean
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon-sm" asChild>
        <Link href={`/empresas/${companyId}/empleados/${employeeId}/editar`}>
          <Pencil />
          <span className="sr-only">Editar</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await toggleEmployeeActive(companyId, employeeId, !active)
          })
        }}
      >
        {active ? <UserX /> : <UserCheck />}
        <span className="sr-only">
          {active ? "Inactivar empleado" : "Activar empleado"}
        </span>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        onClick={() => {
          if (!confirm("¿Eliminar este empleado?")) {
            return
          }

          startTransition(async () => {
            await deleteEmployee(companyId, employeeId)
          })
        }}
      >
        <Trash2 />
        <span className="sr-only">Eliminar</span>
      </Button>
    </div>
  )
}
