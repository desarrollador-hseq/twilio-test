export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil } from "lucide-react"

import { getTemplate } from "@/lib/actions/templates"
import { CampaignMediaImage } from "@/components/campaigns/campaign-media-image"
import { resolveMediaBaseUrl } from "@/lib/messaging/content-variables"
import { templateStatusLabel } from "@/lib/labels"
import { AppShell } from "@/components/app-shell"
import { DeleteTemplateButton } from "@/components/templates/delete-template-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function PlantillaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const templateId = Number(id)

  if (Number.isNaN(templateId)) {
    notFound()
  }

  const template = await getTemplate(templateId)

  if (!template) {
    notFound()
  }

  return (
    <AppShell
      title={template.friendlyName}
      description={template.contentSid}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/plantillas/${template.id}/editar`}>
              <Pencil data-icon="inline-start" />
              Editar
            </Link>
          </Button>
          <DeleteTemplateButton templateId={template.id} />
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Detalle</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Content SID</p>
            <p className="font-mono text-sm">{template.contentSid}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estado</p>
            <Badge>{templateStatusLabel(template.status)}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tipo</p>
            <p>{template.type}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Idioma</p>
            <p>{template.language}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Categoría</p>
            <p>{template.category ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Empresa</p>
            <p>{template.company?.legalName ?? "Global"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Prefijo de URL</p>
            <p className="font-mono text-sm break-all">
              {resolveMediaBaseUrl(template.mediaBaseUrl)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Archivo por defecto</p>
            <p className="font-mono text-sm">{template.mediaFileName ?? "—"}</p>
          </div>
          {template.mediaFileName && (
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Vista previa</p>
              <CampaignMediaImage
                mediaFileName={template.mediaFileName}
                mediaBaseUrl={template.mediaBaseUrl}
                source="template"
                size="md"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  )
}
