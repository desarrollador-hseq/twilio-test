"use client"

import { useTransition } from "react"
import { Trash2 } from "lucide-react"

import { deleteCompany } from "@/lib/actions/companies"
import { Button } from "@/components/ui/button"

export function DeleteCompanyButton({ companyId }: { companyId: number }) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            "¿Eliminar esta empresa? También se eliminarán lógicamente todos sus empleados."
          )
        ) {
          return
        }

        startTransition(async () => {
          await deleteCompany(companyId)
        })
      }}
    >
      <Trash2 data-icon="inline-start" />
      {pending ? "Eliminando..." : "Eliminar empresa"}
    </Button>
  )
}
