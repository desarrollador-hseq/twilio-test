"use client"

import { startTransition, useActionState, useState } from "react"
import { useForm } from "react-hook-form"

import type { ActionState } from "@/lib/actions/types"
import { unsubscribeReasonLabel } from "@/lib/labels"
import { normalizePhoneForInput } from "@/lib/phone"
import { PhoneInputForm } from "@/components/phone-input-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type AreaOption = {
  id: number
  name: string
}

type EmployeeFormValues = {
  firstName: string
  lastName: string
  nationalId: string
  mobilePhone: string
  email: string
  areaId: string
  areaName: string
  active: boolean
  canSendWhatsapp: boolean
  canSendEmail: boolean
}

type UnsubscribeInfo = {
  unsubscribedAt: Date
  unsubscribeReason: string | null
}

type EmployeeFormProps = {
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>
  areas: AreaOption[]
  defaultValues?: Partial<EmployeeFormValues>
  unsubscribeInfo?: UnsubscribeInfo
  submitLabel: string
  cancelHref: string
}

const initialState: ActionState = {}

const selectClassName =
  "h-7 w-full rounded-md border border-input bg-input/20 px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"

function CheckboxField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}

function buildFormData(values: EmployeeFormValues) {
  const formData = new FormData()

  formData.append("firstName", values.firstName)
  formData.append("lastName", values.lastName)
  formData.append("nationalId", values.nationalId)
  formData.append("mobilePhone", values.mobilePhone)
  formData.append("email", values.email)

  if (values.areaName.trim()) {
    formData.append("areaName", values.areaName.trim())
  } else if (values.areaId) {
    formData.append("areaId", values.areaId)
  }

  if (values.active) formData.append("active", "on")
  if (values.canSendWhatsapp) formData.append("canSendWhatsapp", "on")
  if (values.canSendEmail) formData.append("canSendEmail", "on")

  return formData
}

export function EmployeeForm({
  action,
  areas,
  defaultValues,
  unsubscribeInfo,
  submitLabel,
  cancelHref,
}: EmployeeFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const [createNewArea, setCreateNewArea] = useState(
    () =>
      areas.length === 0 ||
      (!defaultValues?.areaId && Boolean(defaultValues?.areaName))
  )

  const form = useForm<EmployeeFormValues>({
    defaultValues: {
      firstName: defaultValues?.firstName ?? "",
      lastName: defaultValues?.lastName ?? "",
      nationalId: defaultValues?.nationalId ?? "",
      mobilePhone: normalizePhoneForInput(defaultValues?.mobilePhone),
      email: defaultValues?.email ?? "",
      areaId: defaultValues?.areaId ?? "",
      areaName: defaultValues?.areaName ?? "",
      active: defaultValues?.active ?? true,
      canSendWhatsapp: defaultValues?.canSendWhatsapp ?? true,
      canSendEmail: defaultValues?.canSendEmail ?? true,
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      formAction(buildFormData(values))
    })
  })

  return (
    <Card className="max-w-2xl">
      <Form {...form}>
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle>Datos del empleado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombres</Label>
                <Input
                  id="firstName"
                  {...form.register("firstName", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellidos</Label>
                <Input
                  id="lastName"
                  {...form.register("lastName", { required: true })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nationalId">Cédula</Label>
                <Input
                  id="nationalId"
                  {...form.register("nationalId", { required: true })}
                />
              </div>
              <PhoneInputForm<EmployeeFormValues>
                control={form.control}
                name="mobilePhone"
                label="Teléfono celular"
                placeholder="300 123 4567"
                disabled={pending}
                rules={{ required: "El teléfono es obligatorio." }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email", { required: true })}
              />
            </div>

            <div className="space-y-3 rounded-md border p-4">
              <div className="space-y-2">
                <Label htmlFor="areaId">Área</Label>
                {!createNewArea ? (
                  <select
                    id="areaId"
                    className={selectClassName}
                    disabled={pending}
                    value={form.watch("areaId")}
                    onChange={(event) => {
                      form.setValue("areaId", event.target.value)
                      form.setValue("areaName", "")
                    }}
                    required
                  >
                    <option value="">Selecciona un área</option>
                    {areas.map((area) => (
                      <option key={area.id} value={String(area.id)}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="areaName"
                    placeholder="Ej: Operaciones"
                    disabled={pending}
                    {...form.register("areaName", { required: createNewArea })}
                  />
                )}
                {areas.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                    onClick={() => {
                      const next = !createNewArea
                      setCreateNewArea(next)
                      if (next) {
                        form.setValue("areaId", "")
                      } else {
                        form.setValue("areaName", "")
                      }
                    }}
                  >
                    {createNewArea
                      ? "Elegir un área existente"
                      : "Crear una área nueva"}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-md border p-4">
              <CheckboxField
                id="active"
                label="Empleado activo"
                description="Desactívalo para impedir su uso sin eliminarlo."
                checked={form.watch("active")}
                onCheckedChange={(checked) => form.setValue("active", checked)}
              />
              <CheckboxField
                id="canSendWhatsapp"
                label="Permitir mensajes por WhatsApp"
                description={
                  unsubscribeInfo
                    ? `Dado de baja el ${unsubscribeInfo.unsubscribedAt.toLocaleString("es-CO")}${
                        unsubscribeInfo.unsubscribeReason
                          ? ` (${unsubscribeReasonLabel(unsubscribeInfo.unsubscribeReason)})`
                          : ""
                      }.`
                    : "El empleado puede responder BAJA por WhatsApp para darse de baja automáticamente."
                }
                checked={form.watch("canSendWhatsapp")}
                onCheckedChange={(checked) =>
                  form.setValue("canSendWhatsapp", checked)
                }
              />
              <CheckboxField
                id="canSendEmail"
                label="Permitir mensajes por correo"
                checked={form.watch("canSendEmail")}
                onCheckedChange={(checked) =>
                  form.setValue("canSendEmail", checked)
                }
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
      </Form>
    </Card>
  )
}
