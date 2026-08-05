"use client"

import { useTransition } from "react"
import { Trash2 } from "lucide-react"

import { deleteTemplate } from "@/lib/actions/templates"
import { Button } from "@/components/ui/button"

export function DeleteTemplateButton({ templateId }: { templateId: number }) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Eliminar esta plantilla?")) {
          return
        }

        startTransition(async () => {
          await deleteTemplate(templateId)
        })
      }}
    >
      <Trash2 data-icon="inline-start" />
      {pending ? "Eliminando..." : "Eliminar"}
    </Button>
  )
}
