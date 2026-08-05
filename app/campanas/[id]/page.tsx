export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"

import { getCampaign } from "@/lib/actions/campaigns"
import { CampaignMediaImage } from "@/components/campaigns/campaign-media-image"
import { resolveMediaSource } from "@/lib/messaging/content-variables"
import { isTwilioConfigured } from "@/lib/env"
import {
  campaignStatusLabel,
  messageStatusLabel,
} from "@/lib/labels"
import { AppShell } from "@/components/app-shell"
import { LaunchCampaignButton } from "@/components/campaigns/launch-campaign-button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function CampanaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const campaignId = Number(id)

  if (Number.isNaN(campaignId)) {
    notFound()
  }

  const campaign = await getCampaign(campaignId)

  if (!campaign) {
    notFound()
  }

  const twilioReady = isTwilioConfigured()
  const media = resolveMediaSource(
    campaign.mediaFileName,
    campaign.template.mediaFileName,
    campaign.template.mediaBaseUrl
  )

  return (
    <AppShell
      title={campaign.name}
      description={`${campaign.company.legalName} · ${campaign.template.friendlyName}`}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <Badge className="mt-1">
                {campaignStatusLabel(campaign.status)}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Canal</p>
              <p>{campaign.channel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Plantilla</p>
              <p className="font-mono text-xs">{campaign.template.contentSid}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <p className="mb-2 text-xs text-muted-foreground">Imagen</p>
              <CampaignMediaImage
                mediaFileName={media.fileName}
                mediaBaseUrl={campaign.template.mediaBaseUrl}
                source={media.source}
                size="md"
                showMeta
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Enviada</p>
              <p>
                {campaign.sentAt
                  ? campaign.sentAt.toLocaleString("es-CO")
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        {campaign.status === "draft" && (
          <Card>
            <CardHeader>
              <CardTitle>Lanzar campaña</CardTitle>
              <CardDescription>
                {twilioReady
                  ? "Se enviará a empleados activos con permiso de WhatsApp."
                  : "Configura TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_FROM"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {twilioReady ? (
                <LaunchCampaignButton
                  campaignId={campaign.id}
                  mediaFileName={media.fileName}
                />
              ) : (
                <p className="text-sm text-destructive">
                  Twilio no está configurado.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Mensajes</CardTitle>
            <CardDescription>
              {campaign.messages.length === 0
                ? "Aún no hay mensajes registrados."
                : `${campaign.messages.length} mensaje${campaign.messages.length === 1 ? "" : "s"}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaign.messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Lanza la campaña para ver el tracking de envíos.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Message SID</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        {message.employee.firstName} {message.employee.lastName}
                      </TableCell>
                      <TableCell>{message.employee.mobilePhone}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            message.status === "failed" ? "destructive" : "outline"
                          }
                        >
                          {messageStatusLabel(message.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {message.messageSid ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {message.contentVariables ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-destructive">
                        {message.errorMessage ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
