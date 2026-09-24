"use client"

import { useActionState, useMemo, useState } from "react"

import type { ActionState } from "@/lib/actions/types"
import { DEFAULT_MEDIA_BASE_URL } from "@/lib/messaging/content-variables"
import {
  detectPresetFromSchema,
  PRESET_VARIABLE_SCHEMAS,
  presetLabel,
  schemaFromPreset,
  schemaHasMediaVariable,
  serializeVariableSchema,
  TEMPLATE_VARIABLE_PRESETS,
  type TemplateVariablePreset,
} from "@/lib/messaging/template-variable-schema"
import { ImportTwilioSchemaButton } from "@/components/templates/import-twilio-schema-button"
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

export function TemplateForm({
  action,
  companies,
  defaultValues,
  submitLabel,
  cancelHref,
}: TemplateFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  const initialPreset = defaultValues?.variableSchema
    ? detectPresetFromSchema(defaultValues.variableSchema)
    : "image_greeting"

  const [variablePreset, setVariablePreset] =
    useState<TemplateVariablePreset>(initialPreset)
  const [customSchemaJson, setCustomSchemaJson] = useState(
    initialPreset === "custom" && defaultValues?.variableSchema
      ? defaultValues.variableSchema
      : serializeVariableSchema(PRESET_VARIABLE_SCHEMAS.image_greeting)
  )

  const activeSchema = useMemo(() => {
    return schemaFromPreset(variablePreset, customSchemaJson).schema
  }, [variablePreset, customSchemaJson])

  const showMediaFields = schemaHasMediaVariable(activeSchema)

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
                setVariablePreset(data.preset)
                setCustomSchemaJson(data.variableSchemaJson)

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

          <div className="space-y-2">
            <Label htmlFor="variablePreset">Tipo de variables</Label>
            <select
              id="variablePreset"
              name="variablePreset"
              className={selectClassName}
              value={variablePreset}
              onChange={(e) =>
                setVariablePreset(e.target.value as TemplateVariablePreset)
              }
            >
              {TEMPLATE_VARIABLE_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {presetLabel(preset)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Debe coincidir con los placeholders {"{{1}}"}, {"{{2}}"}, etc. de
              la plantilla aprobada en Twilio.
            </p>
          </div>

          {variablePreset === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="variableSchemaJson">Esquema (JSON)</Label>
              <textarea
                id="variableSchemaJson"
                name="variableSchemaJson"
                className="min-h-40 w-full rounded-md border border-input bg-input/20 px-2 py-2 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                value={customSchemaJson}
                onChange={(e) => setCustomSchemaJson(e.target.value)}
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">
                Array de objetos con <code>key</code>, <code>label</code>,{" "}
                <code>kind</code> (<code>static</code>, <code>employee</code>,{" "}
                <code>media</code>).
              </p>
            </div>
          )}

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

          {showMediaFields && (
            <>
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
                  Parte fija de la Media URL en Twilio, antes del path en la
                  variable de tipo media. Por defecto usa el CDN de Grupo HSEQ.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mediaFileName">
                  Archivo multimedia por defecto
                </Label>
                <Input
                  id="mediaFileName"
                  name="mediaFileName"
                  defaultValue={defaultValues?.mediaFileName ?? ""}
                  placeholder="jor-ambiental-ghseq.png"
                />
                <p className="text-xs text-muted-foreground">
                  Solo el nombre del archivo si Twilio concatena prefijo + path.
                  Puede sobreescribirse al crear una campaña.
                </p>
              </div>
            </>
          )}

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
