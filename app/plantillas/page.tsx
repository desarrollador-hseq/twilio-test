export const dynamic = "force-dynamic"

import Link from "next/link"
import { Plus } from "lucide-react"

import { getTemplates } from "@/lib/actions/templates"
import { templateStatusLabel } from "@/lib/labels"
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

export default async function PlantillasPage() {
  const templates = await getTemplates()

  return (
    <AppShell
      title="Plantillas"
      description="Plantillas de contenido aprobadas en Twilio."
      actions={
        <Button asChild>
          <Link href="/plantillas/nueva">
            <Plus data-icon="inline-start" />
            Nueva plantilla
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>
            {templates.length === 0
              ? "Registra el Content SID de tus plantillas de Twilio."
              : `${templates.length} plantilla${templates.length === 1 ? "" : "s"} registrada${templates.length === 1 ? "" : "s"}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-md border border-dashed p-8">
              <p className="text-sm text-muted-foreground">
                Crea y aprueba plantillas en Twilio, luego regístralas aquí con
                su Content SID.
              </p>
              <Button asChild>
                <Link href="/plantillas/nueva">Registrar plantilla</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Content SID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/plantillas/${template.id}`}
                        className="hover:underline"
                      >
                        {template.friendlyName}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {template.contentSid}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{template.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          template.status === "approved" ? "default" : "secondary"
                        }
                      >
                        {templateStatusLabel(template.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {template.company?.legalName ?? "Global"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/plantillas/${template.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  )
}
