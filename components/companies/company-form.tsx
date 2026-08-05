"use client"

import { useActionState } from "react"

import type { ActionState } from "@/lib/actions/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type CompanyFormProps = {
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>
  defaultValues?: {
    legalName?: string
    taxId?: string
  }
  submitLabel: string
  cancelHref: string
}

const initialState: ActionState = {}

export function CompanyForm({
  action,
  defaultValues,
  submitLabel,
  cancelHref,
}: CompanyFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <Card className="max-w-lg">
      <form action={formAction}>
        <CardHeader>
          <CardTitle>Datos de la empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="legalName">Razón social</Label>
            <Input
              id="legalName"
              name="legalName"
              defaultValue={defaultValues?.legalName}
              required
              placeholder="Ej. Acme S.A.S."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">NIT</Label>
            <Input
              id="taxId"
              name="taxId"
              defaultValue={defaultValues?.taxId}
              required
              placeholder="Ej. 900123456-1"
            />
          </div>
        </CardContent>
        <CardFooter className="gap-2 border-t">
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : submitLabel}
          </Button>
          <Button variant="outline" asChild>
            <a href={cancelHref}>Cancelar</a>
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
