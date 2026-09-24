"use client"

import { useActionState, useMemo } from "react"

import { sendTemplateTestMessage } from "@/lib/actions/messages"
import type { ActionState } from "@/lib/actions/types"
import {
  resolveTemplateVariableSchema,
  schemaHasMediaVariable,
  schemaStaticVariables,
  variableKindLabel,
} from "@/lib/messaging/template-variable-schema"
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

type EmployeeOption = {
  id: number
  firstName: string
  lastName: string
  mobilePhone: string
  company: { legalName: string }
}

type SendTemplateTestFormProps = {
  templateId: number
  templateName: string
  variableSchema: string | null
  employees: EmployeeOption[]
  cancelHref: string
}

type SendTestState = ActionState & { messageSid?: string }

const initialState: SendTestState = {}

const selectClassName =
  "h-7 w-full rounded-md border border-input bg-input/20 px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"

export function SendTemplateTestForm({
  templateId,
  templateName,
  variableSchema,
  employees,
  cancelHref,
}: SendTemplateTestFormProps) {
  const [state, formAction, pending] = useActionState(
    sendTemplateTestMessage,
    initialState
  )

  const schema = useMemo(
    () => resolveTemplateVariableSchema(variableSchema),
    [variableSchema]
  )
  const staticVariables = useMemo(
    () => schemaStaticVariables(schema),
    [schema]
  )
  const usesMedia = schemaHasMediaVariable(schema)

  return (
    <Card className="max-w-2xl">
      <form action={formAction}>
        <input type="hidden" name="templateId" value={templateId} />
        <CardHeader>
          <CardTitle>Enviar prueba</CardTitle>
          <p className="text-sm text-muted-foreground">{templateName}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              Mensaje encolado correctamente.
              {state.messageSid ? (
                <>
                  {" "}
                  SID: <code>{state.messageSid}</code>
                </>
              ) : null}
            </p>
          )}

          {employees.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay empleados elegibles para WhatsApp
              {staticVariables.length > 0 ? " en el ámbito de esta plantilla" : ""}.
            </p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="employeeId">Destinatario</Label>
              <select
                id="employeeId"
                name="employeeId"
                required
                className={selectClassName}
                defaultValue=""
              >
                <option value="" disabled>
                  Seleccionar empleado
                </option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} ·{" "}
                    {employee.company.legalName} · {employee.mobilePhone}
                  </option>
                ))}
              </select>
            </div>
          )}

          <ul className="space-y-1 text-xs text-muted-foreground">
            {schema.map((def) => (
              <li key={def.key}>
                <code>{`{{${def.key}}}`}</code> {def.label} —{" "}
                {variableKindLabel(def.kind)}
              </li>
            ))}
          </ul>

          {staticVariables.map((def) => (
            <div key={def.key} className="space-y-2">
              <Label htmlFor={`contentVar_${def.key}`}>
                {def.label} ({`{{${def.key}}}`})
              </Label>
              <Input
                id={`contentVar_${def.key}`}
                name={`contentVar_${def.key}`}
                type={def.input === "url" ? "url" : "text"}
                required={def.required}
              />
            </div>
          ))}

          {usesMedia && (
            <p className="text-xs text-muted-foreground">
              La multimedia se toma del archivo por defecto configurado en la
              plantilla (o del path definido en Twilio).
            </p>
          )}
        </CardContent>
        <CardFooter className="gap-2 border-t">
          <Button
            type="submit"
            disabled={pending || employees.length === 0}
          >
            {pending ? "Enviando…" : "Enviar WhatsApp de prueba"}
          </Button>
          <Button variant="outline" asChild>
            <a href={cancelHref}>Volver</a>
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
