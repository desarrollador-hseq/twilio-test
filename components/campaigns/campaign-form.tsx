"use client"

import { useActionState, useEffect, useMemo, useState } from "react"

import type { ActionState } from "@/lib/actions/types"
import { CampaignMediaImage } from "@/components/campaigns/campaign-media-image"
import { resolveMediaSource } from "@/lib/messaging/content-variables"
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

  const templatePreview = resolveMediaSource(
    null,
    selectedTemplate?.mediaFileName,
    selectedTemplate?.mediaBaseUrl
  )

  useEffect(() => {
    if (!selectedFile) {
      setLocalPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(selectedFile)
    setLocalPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [selectedFile])

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setFileError(null)

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
              hasta 16 MB). Se sube a DigitalOcean Spaces y la URL queda
              guardada en la campaña. Si no subes archivo, se usa el de la
              plantilla
              {selectedTemplate?.mediaFileName ? (
                <>
                  : <code>{selectedTemplate.mediaFileName}</code>
                </>
              ) : (
                "."
              )}{" "}
              El nombre del empleado ({"{{1}}"}) se toma automáticamente al
              enviar.
            </p>
          </div>
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
