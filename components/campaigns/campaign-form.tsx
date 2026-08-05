"use client"

import { useActionState, useMemo, useState } from "react"

import type { ActionState } from "@/lib/actions/types"
import { CampaignMediaImage } from "@/components/campaigns/campaign-media-image"
import { resolveMediaSource } from "@/lib/messaging/content-variables"
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
  const [mediaOverride, setMediaOverride] = useState("")

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

  const previewMedia = resolveMediaSource(
    mediaOverride,
    selectedTemplate?.mediaFileName,
    selectedTemplate?.mediaBaseUrl
  )

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
            <Label htmlFor="mediaFileName">
              Archivo de imagen (opcional)
            </Label>
            <Input
              id="mediaFileName"
              name="mediaFileName"
              value={mediaOverride}
              onChange={(e) => setMediaOverride(e.target.value)}
              placeholder={
                selectedTemplate?.mediaFileName ??
                "jor-ambiental-ghseq.png"
              }
            />
            {previewMedia.fileName && (
              <CampaignMediaImage
                mediaFileName={previewMedia.fileName}
                mediaBaseUrl={selectedTemplate?.mediaBaseUrl}
                source={previewMedia.source}
                size="lg"
                showMeta
              />
            )}
            <p className="text-xs text-muted-foreground">
              Solo el nombre del archivo (ej. <code>jor-ambiental-ghseq.png</code>),
              no la URL completa. Si lo dejas vacío, se usa el de la plantilla
              {selectedTemplate?.mediaFileName ? (
                <>
                  :{" "}
                  <code>{selectedTemplate.mediaFileName}</code>
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
          <Button type="submit" disabled={pending}>
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
