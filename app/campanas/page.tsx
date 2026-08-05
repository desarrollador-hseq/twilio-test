export const dynamic = "force-dynamic"

import Link from "next/link"
import { Plus } from "lucide-react"

import { getCampaigns } from "@/lib/actions/campaigns"
import { CampaignMediaImage } from "@/components/campaigns/campaign-media-image"
import { resolveMediaSource } from "@/lib/messaging/content-variables"
import { campaignStatusLabel } from "@/lib/labels"
import { AppShell } from "@/components/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

export default async function CampanasPage() {
  const campaigns = await getCampaigns()

  return (
    <AppShell
      title="Campañas"
      description="Envíos masivos a empleados por empresa."
      actions={
        <Button asChild>
          <Link href="/campanas/nueva">
            <Plus data-icon="inline-start" />
            Nueva campaña
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>
            {campaigns.length === 0
              ? "Aún no hay campañas creadas."
              : `${campaigns.length} campaña${campaigns.length === 1 ? "" : "s"}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-md border border-dashed p-8">
              <p className="text-sm text-muted-foreground">
                Crea una campaña seleccionando empresa y plantilla aprobada.
              </p>
              <Button asChild>
                <Link href="/campanas/nueva">Crear campaña</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Imagen</TableHead>
                  <TableHead>Plantilla</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Mensajes</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const media = resolveMediaSource(
                    campaign.mediaFileName,
                    campaign.template.mediaFileName,
                    campaign.template.mediaBaseUrl
                  )

                  return (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/campanas/${campaign.id}`}
                        className="hover:underline"
                      >
                        {campaign.name}
                      </Link>
                    </TableCell>
                    <TableCell>{campaign.company.legalName}</TableCell>
                    <TableCell>
                      <CampaignMediaImage
                        mediaFileName={media.fileName}
                        mediaBaseUrl={campaign.template.mediaBaseUrl}
                        source={media.source}
                        size="sm"
                      />
                    </TableCell>
                    <TableCell>{campaign.template.friendlyName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{campaign.channel}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          campaign.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {campaignStatusLabel(campaign.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{campaign._count.messages}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/campanas/${campaign.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  )
}
