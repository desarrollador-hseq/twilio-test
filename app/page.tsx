export const dynamic = "force-dynamic"

import Link from "next/link"
import {
  Building2,
  FileText,
  Layers,
  Megaphone,
  MessageSquare,
  UserCheck,
  Users,
  UserX,
} from "lucide-react"

import { getDashboardStats } from "@/lib/actions/dashboard"
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

function KpiCard({
  title,
  value,
  hint,
  href,
  icon: Icon,
}: {
  title: string
  value: number
  hint?: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
}) {
  const content = (
    <Card className={href ? "transition-colors hover:bg-muted/40" : undefined}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="font-heading text-2xl font-medium tabular-nums">
          {value.toLocaleString("es-CO")}
        </p>
        {hint && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </CardContent>
    </Card>
  )

  if (!href) return content

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  )
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums font-medium">
        {value.toLocaleString("es-CO")}
      </span>
    </div>
  )
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <AppShell
      title="Dashboard"
      description="Resumen de empresas, empleados, plantillas y campañas."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/empresas">
              <Building2 data-icon="inline-start" />
              Empresas
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/campanas/nueva">
              <Megaphone data-icon="inline-start" />
              Nueva campaña
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Empresas"
            value={stats.companies}
            href="/empresas"
            icon={Building2}
          />
          <KpiCard
            title="Empleados"
            value={stats.employees.total}
            hint={`${stats.employees.active} activos · ${stats.employees.inactive} inactivos`}
            href="/empresas"
            icon={Users}
          />
          <KpiCard
            title="Áreas"
            value={stats.areas}
            href="/empresas"
            icon={Layers}
          />
          <KpiCard
            title="Plantillas"
            value={stats.templates}
            href="/plantillas"
            icon={FileText}
          />
          <KpiCard
            title="Campañas"
            value={stats.campaigns.total}
            hint={`${stats.campaigns.completed} completadas · ${stats.campaigns.draft} borrador`}
            href="/campanas"
            icon={Megaphone}
          />
          <KpiCard
            title="Mensajes"
            value={stats.messages.total}
            hint={`${stats.messages.sent} enviados · ${stats.messages.failed} fallidos`}
            href="/campanas"
            icon={MessageSquare}
          />
          <KpiCard
            title="WhatsApp habilitado"
            value={stats.employees.whatsapp}
            hint="Empleados que pueden recibir WhatsApp"
            icon={UserCheck}
          />
          <KpiCard
            title="Bajas WhatsApp"
            value={stats.employees.unsubscribed}
            hint="Opt-out registrados"
            icon={UserX}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Campañas por estado</CardTitle>
              <CardDescription>
                Distribución actual de campañas activas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatRow label="Borrador" value={stats.campaigns.draft} />
              <StatRow label="Enviando" value={stats.campaigns.sending} />
              <StatRow label="Completadas" value={stats.campaigns.completed} />
              <StatRow label="Fallidas" value={stats.campaigns.failed} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mensajes por resultado</CardTitle>
              <CardDescription>
                Acumulado de envíos registrados en el sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatRow label="En cola" value={stats.messages.queued} />
              <StatRow label="Enviados / entregados" value={stats.messages.sent} />
              <StatRow label="Entregados / leídos" value={stats.messages.delivered} />
              <StatRow label="Fallidos / no entregados" value={stats.messages.failed} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Últimas campañas</CardTitle>
              <CardDescription>
                Las 5 campañas más recientes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no hay campañas.{" "}
                  <Link href="/campanas/nueva" className="underline underline-offset-2">
                    Crear una
                  </Link>
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Msgs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentCampaigns.map((campaign) => (
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
                        <TableCell className="text-right tabular-nums">
                          {campaign._count.messages}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Empresas con más empleados</CardTitle>
              <CardDescription>
                Top 5 por cantidad de empleados activos en el sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no hay empresas.{" "}
                  <Link href="/empresas/nueva" className="underline underline-offset-2">
                    Registrar una
                  </Link>
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead className="text-right">Empleados</TableHead>
                      <TableHead className="text-right">Áreas</TableHead>
                      <TableHead className="text-right">Campañas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.topCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/empresas/${company.id}`}
                            className="hover:underline"
                          >
                            {company.legalName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {company._count.employees}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {company._count.areas}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {company._count.campaigns}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
