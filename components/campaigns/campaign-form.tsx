"use client"

import { useActionState, useMemo, useState } from "react"

import type { ActionState } from "@/lib/actions/types"
import { CampaignMediaImage } from "@/components/campaigns/campaign-media-image"
import { resolveMediaSource } from "@/lib/messaging/content-variables"
import {
  resolveTemplateVariableSchema,
  schemaHasMediaVariable,
  schemaStaticVariables,
  variableKindLabel,
} from "@/lib/messaging/template-variable-schema"
import { validateCampaignMediaFile } from "@/lib/storage/media-validation"
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
type TemplateOption = {
  id: number
  friendlyName: string
  contentSid: string
  companyId: number | null
  mediaFileName?: string | null
  mediaBaseUrl?: string | null
  variableSchema?: string | null
}

type CampaignFormProps = {
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>
  companies: CompanyOption[]
  templates: TemplateOption[]
  submitLabel: string
  cancelHref: string
}

const initialState: ActionState = {}

const selectClassName =
  "h-7 w-full rounded-md border border-input bg-input/20 px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"

export function CampaignForm({
  action,
  companies,
  templates,
  submitLabel,
  cancelHref,
}: CampaignFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const [selectedCompanyId, setSelectedCompanyId] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)

  const availableTemplates = useMemo(() => {
    if (!selectedCompanyId) {
      return templates
    }

    const companyId = Number(selectedCompanyId)
    return templates.filter(
      (template) =>
        template.companyId === null || template.companyId === companyId
    )
  }, [selectedCompanyId, templates])

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) {
      return null
    }

    return (
      availableTemplates.find(
        (template) => template.id === Number(selectedTemplateId)
      ) ?? null
    )
  }, [availableTemplates, selectedTemplateId])

  const templateSchema = useMemo(
    () => resolveTemplateVariableSchema(selectedTemplate?.variableSchema),
    [selectedTemplate?.variableSchema]
  )

  const staticVariables = useMemo(
    () => schemaStaticVariables(templateSchema),
    [templateSchema]
  )

  const usesMedia = schemaHasMediaVariable(templateSchema)

  const templatePreview = resolveMediaSource(
    null,
    selectedTemplate?.mediaFileName,
    selectedTemplate?.mediaBaseUrl
  )

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setFileError(null)

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl)
      setLocalPreviewUrl(null)
    }

    if (!file) {
      setSelectedFile(null)
      return
    }

    const validation = validateCampaignMediaFile(file)
    if (!validation.ok) {
      setSelectedFile(null)
      setFileError(validation.error)
      event.target.value = ""
      return
    }

    setSelectedFile(file)
    setLocalPreviewUrl(URL.createObjectURL(file))
  }

  return (
    <Card className="max-w-2xl">
      <form action={formAction}>
        <CardHeader>
          <CardTitle>Nueva campaña</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la campaña</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Ej. Recordatorio inducción HSEQ"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyId">Empresa</Label>
              <select
                id="companyId"
                name="companyId"
                required
                className={selectClassName}
                value={selectedCompanyId}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value)
                  setSelectedTemplateId("")
                }}
              >
                <option value="" disabled>
                  Seleccionar empresa
                </option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.legalName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateId">Plantilla</Label>
              <select
                id="templateId"
                name="templateId"
                required
                className={selectClassName}
                value={selectedTemplateId}
                disabled={availableTemplates.length === 0}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                <option value="" disabled>
                  {availableTemplates.length === 0
                    ? "No hay plantillas disponibles"
                    : "Seleccionar plantilla"}
                </option>
                {availableTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.friendlyName} ({template.contentSid})
                    {template.companyId === null ? " · Global" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel">Canal</Label>
            <select
              id="channel"
              name="channel"
              defaultValue="whatsapp"
              className={selectClassName}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Correo (próximamente)</option>
            </select>
          </div>

          {selectedTemplate && (
            <div className="space-y-3 rounded-md border border-border/60 bg-muted/20 p-3">
              <p className="text-sm font-medium">Variables de la plantilla</p>
              <ul className="space-y-2 text-sm">
                {templateSchema.map((def) => (
                  <li key={def.key} className="flex flex-col gap-0.5">
                    <span>
                      <code>{`{{${def.key}}}`}</code> — {def.label}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({variableKindLabel(def.kind)})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {staticVariables.map((def) => (
            <div key={def.key} className="space-y-2">
              <Label htmlFor={`contentVar_${def.key}`}>
                {def.label} ({`{{${def.key}}}`})
              </Label>
              {def.input === "textarea" ? (
                <textarea
                  id={`contentVar_${def.key}`}
                  name={`contentVar_${def.key}`}
                  required={def.required}
                  className="min-h-24 w-full rounded-md border border-input bg-input/20 px-2 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              ) : (
                <Input
                  id={`contentVar_${def.key}`}
                  name={`contentVar_${def.key}`}
                  type={def.input === "url" ? "url" : "text"}
                  required={def.required}
                  placeholder={
                    def.input === "url"
                      ? "https://..."
                      : `Valor para {{${def.key}}}`
                  }
                />
              )}
            </div>
          ))}

          {usesMedia && (
            <div className="space-y-2">
              <Label htmlFor="mediaFile">
                Archivo multimedia (opcional)
              </Label>
              <Input
                id="mediaFile"
                name="mediaFile"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                onChange={handleFileChange}
              />
              {fileError && (
                <p className="text-sm text-destructive">{fileError}</p>
              )}
              {localPreviewUrl && selectedFile && (
                <CampaignMediaImage
                  mediaFileName={localPreviewUrl}
                  source="campaign"
                  mediaKind={
                    selectedFile.type.startsWith("video/") ? "video" : "image"
                  }
                  size="lg"
                  showMeta
                />
              )}
              {!localPreviewUrl && templatePreview.fileName && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Vista previa de la plantilla (se usa si no subes archivo):
                  </p>
                  <CampaignMediaImage
                    mediaFileName={templatePreview.fileName}
                    mediaBaseUrl={selectedTemplate?.mediaBaseUrl}
                    source={templatePreview.source}
                    size="lg"
                    showMeta
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Imagen (JPG, PNG, GIF, WEBP hasta 5 MB) o video (MP4, WEBM, MOV
                hasta 16 MB). Se sube a DigitalOcean Spaces. Si no subes
                archivo, se usa el de la plantilla
                {selectedTemplate?.mediaFileName ? (
                  <>
                    : <code>{selectedTemplate.mediaFileName}</code>
                  </>
                ) : (
                  "."
                )}
              </p>
            </div>
          )}

          {selectedTemplate &&
            templateSchema.some((def) => def.kind === "employee") && (
              <p className="text-xs text-muted-foreground">
                Las variables de empleado se completan automáticamente al enviar
                (nombre de cada destinatario).
              </p>
            )}
        </CardContent>
        <CardFooter className="gap-2 border-t">
          <Button type="submit" disabled={pending || Boolean(fileError)}>
            {pending ? "Creando..." : submitLabel}
          </Button>
          <Button variant="outline" asChild>
            <a href={cancelHref}>Cancelar</a>
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
