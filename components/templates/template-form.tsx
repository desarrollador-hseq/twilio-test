"use client"

import { useActionState } from "react"

import type { ActionState } from "@/lib/actions/types"
import { DEFAULT_MEDIA_BASE_URL } from "@/lib/messaging/content-variables"
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

type CompanyOption = { id: number; legalName: string }

type TemplateFormValues = {
  contentSid?: string
  friendlyName?: string
  language?: string
  category?: string
  type?: string
  status?: string
  mediaBaseUrl?: string | null
  mediaFileName?: string | null
  companyId?: number | null
}

type TemplateFormProps = {
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>
  companies: CompanyOption[]
  defaultValues?: TemplateFormValues
  submitLabel: string
  cancelHref: string
}

const initialState: ActionState = {}

const selectClassName =
  "h-7 w-full rounded-md border border-input bg-input/20 px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"

export function TemplateForm({
  action,
  companies,
  defaultValues,
  submitLabel,
  cancelHref,
}: TemplateFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <Card className="max-w-2xl">
      <form action={formAction}>
        <CardHeader>
          <CardTitle>Datos de la plantilla</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="contentSid">Content SID (Twilio)</Label>
            <Input
              id="contentSid"
              name="contentSid"
              defaultValue={defaultValues?.contentSid}
              required
              placeholder="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="friendlyName">Nombre</Label>
            <Input
              id="friendlyName"
              name="friendlyName"
              defaultValue={defaultValues?.friendlyName}
              required
              placeholder="Ej. Recordatorio HSEQ"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Input
                id="language"
                name="language"
                defaultValue={defaultValues?.language ?? "es"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                name="category"
                defaultValue={defaultValues?.category ?? ""}
                placeholder="UTILITY, MARKETING..."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                defaultValue={defaultValues?.type ?? "whatsapp"}
                className={selectClassName}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                name="status"
                defaultValue={defaultValues?.status ?? "approved"}
                className={selectClassName}
              >
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobada</option>
                <option value="rejected">Rechazada</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mediaBaseUrl">Prefijo de URL de imagen</Label>
            <Input
              id="mediaBaseUrl"
              name="mediaBaseUrl"
              defaultValue={
                defaultValues?.mediaBaseUrl ?? DEFAULT_MEDIA_BASE_URL
              }
              placeholder={DEFAULT_MEDIA_BASE_URL}
            />
            <p className="text-xs text-muted-foreground">
              Parte fija de la Media URL en Twilio, antes de {"{{2}}"}. Por
              defecto usa el CDN de Grupo HSEQ. Ejemplo completo:{" "}
              <code>
                {DEFAULT_MEDIA_BASE_URL}
                {"{{2}}"}
              </code>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mediaFileName">
              Archivo de imagen por defecto (variable {"{{2}}"})
            </Label>
            <Input
              id="mediaFileName"
              name="mediaFileName"
              defaultValue={defaultValues?.mediaFileName ?? ""}
              placeholder="jor-ambiental-ghseq.png"
            />
            <p className="text-xs text-muted-foreground">
              Solo el nombre del archivo (ej. <code>jor-ambiental-ghseq.png</code>),
              no la URL completa. Twilio ya concatena el prefijo con {"{{2}}"}.
              El nombre del empleado ({"{{1}}"}) se completa automáticamente al
              enviar.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyId">Empresa (opcional)</Label>
            <select
              id="companyId"
              name="companyId"
              defaultValue={
                defaultValues?.companyId
                  ? String(defaultValues.companyId)
                  : "none"
              }
              className={selectClassName}
            >
              <option value="none">Global (todas las empresas)</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.legalName}
                </option>
              ))}
            </select>
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
