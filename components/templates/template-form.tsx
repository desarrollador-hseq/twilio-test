"use client"

import { useActionState, useMemo, useState } from "react"

import type { ActionState } from "@/lib/actions/types"
import {
  parseVariableSchemaJson,
  PRESET_VARIABLE_SCHEMAS,
  serializeVariableSchema,
  type TemplateVariableDef,
} from "@/lib/messaging/template-variable-schema"
import { ImportTwilioSchemaButton } from "@/components/templates/import-twilio-schema-button"
import { TemplateVariableBuilder } from "@/components/templates/template-variable-builder"
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
  variableSchema?: string | null
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

function initialSchemaRows(
  variableSchema: string | null | undefined
): TemplateVariableDef[] {
  const parsed = parseVariableSchemaJson(variableSchema ?? "")
  if (parsed && parsed.length > 0) {
    return parsed
  }
  return [...PRESET_VARIABLE_SCHEMAS.image_greeting]
}

export function TemplateForm({
  action,
  companies,
  defaultValues,
  submitLabel,
  cancelHref,
}: TemplateFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  const [customSchemaJson, setCustomSchemaJson] = useState(() =>
    defaultValues?.variableSchema
      ? defaultValues.variableSchema
      : serializeVariableSchema(PRESET_VARIABLE_SCHEMAS.image_greeting)
  )
  const [showAdvancedJson, setShowAdvancedJson] = useState(false)
  const [schemaRows, setSchemaRows] = useState<TemplateVariableDef[]>(() =>
    initialSchemaRows(defaultValues?.variableSchema)
  )

  function handleBuilderChange(nextSchema: TemplateVariableDef[]) {
    setSchemaRows(nextSchema)
    setCustomSchemaJson(serializeVariableSchema(nextSchema))
  }

  function handleJsonChange(json: string) {
    setCustomSchemaJson(json)
    const parsed = parseVariableSchemaJson(json)
    if (parsed) {
      setSchemaRows(parsed)
    }
  }

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
            <ImportTwilioSchemaButton
              onImported={(data) => {
                setCustomSchemaJson(data.variableSchemaJson)
                const parsed = parseVariableSchemaJson(data.variableSchemaJson)
                if (parsed) {
                  setSchemaRows(parsed)
                }

                if (data.friendlyName) {
                  const nameInput =
                    document.querySelector<HTMLInputElement>("#friendlyName")
                  if (nameInput && !nameInput.value.trim()) {
                    nameInput.value = data.friendlyName
                  }
                }

                if (data.language) {
                  const languageInput =
                    document.querySelector<HTMLInputElement>("#language")
                  if (languageInput && !languageInput.value.trim()) {
                    languageInput.value = data.language
                  }
                }
              }}
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

          <TemplateVariableBuilder
            schema={schemaRows}
            onChange={handleBuilderChange}
            showJson={showAdvancedJson}
            jsonValue={customSchemaJson}
            onJsonChange={handleJsonChange}
          />
          <input
            type="hidden"
            name="variableSchemaJson"
            value={customSchemaJson}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedJson((value) => !value)}
          >
            {showAdvancedJson ? "Ocultar JSON" : "Editar JSON (avanzado)"}
          </Button>

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
