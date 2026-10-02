"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { Copy, KeyRound, RefreshCw, ShieldOff } from "lucide-react"

import {
  createApiApplication,
  revokeApiApplication,
  rotateApiApplicationToken,
  type CreateApiApplicationState,
} from "@/lib/actions/api-applications"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

export type ApiApplicationRow = {
  id: number
  name: string
  description: string | null
  tokenPrefix: string
  active: boolean
  lastUsedAt: Date | null
  revokedAt: Date | null
  createdAt: Date
}

type ApiApplicationsPanelProps = {
  applications: ApiApplicationRow[]
  appUrl: string
}

const initialCreateState: CreateApiApplicationState = {}

function TokenRevealDialog({
  token,
  open,
  onOpenChange,
}: {
  token: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) {
      setCopied(false)
    }
  }, [open])

  async function copyToken() {
    if (!token) {
      return
    }
    await navigator.clipboard.writeText(token)
    setCopied(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Token de API</DialogTitle>
          <DialogDescription>
            Copia este token ahora. Por seguridad no se volverá a mostrar
            completo en la aplicación.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border bg-muted/40 p-3 font-mono text-xs break-all">
          {token}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => copyToken()}>
            <Copy data-icon="inline-start" />
            {copied ? "Copiado" : "Copiar token"}
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ApiApplicationsPanel({
  applications,
  appUrl,
}: ApiApplicationsPanelProps) {
  const [createState, createAction, createPending] = useActionState(
    createApiApplication,
    initialCreateState
  )
  const [revealedToken, setRevealedToken] = useState<string | null>(null)
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingId, startTransition] = useTransition()

  useEffect(() => {
    if (createState.token) {
      setRevealedToken(createState.token)
      setTokenDialogOpen(true)
    }
  }, [createState.token])

  function handleRevoke(applicationId: number, name: string) {
    if (
      !confirm(
        `¿Revocar el acceso de "${name}"? Las peticiones con su token dejarán de funcionar.`
      )
    ) {
      return
    }

    setActionError(null)
    startTransition(async () => {
      const result = await revokeApiApplication(applicationId)
      if (result.error) {
        setActionError(result.error)
      }
    })
  }

  function handleRotate(applicationId: number, name: string) {
    if (
      !confirm(
        `¿Generar un token nuevo para "${name}"? El token anterior dejará de funcionar de inmediato.`
      )
    ) {
      return
    }

    setActionError(null)
    startTransition(async () => {
      const result = await rotateApiApplicationToken(applicationId)
      if (result.error) {
        setActionError(result.error)
        return
      }
      if (result.token) {
        setRevealedToken(result.token)
        setTokenDialogOpen(true)
      }
    })
  }

  const notificationExample = `curl -X POST ${appUrl}/api/messages/notification \\
  -H "Authorization: Bearer TU_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"3001234567","text":"Se te asignó el presupuesto para febrero."}'`

  const notificationDetailExample = `curl -X POST ${appUrl}/api/messages/hseqcloud/notification-detail \\
  -H "Authorization: Bearer TU_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"3001234567","recipientName":"María García","companyName":"Logística del Pacífico Ltda.","subject":"Firma pendiente en ATS","message":"Tienes una solicitud de firma..."}'`

  return (
    <div className="space-y-6">
      <TokenRevealDialog
        token={revealedToken}
        open={tokenDialogOpen}
        onOpenChange={setTokenDialogOpen}
      />

      <Card>
        <CardHeader>
          <CardTitle>Registrar aplicación</CardTitle>
          <CardDescription>
            Cada sistema externo (ERP, intranet, etc.) debe tener su propia
            aplicación y token.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createAction} className="grid max-w-xl gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ej. Sistema de nómina"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                placeholder="Uso previsto, responsable, entorno…"
              />
            </div>
            {createState.error && (
              <p className="text-sm text-destructive">{createState.error}</p>
            )}
            <Button type="submit" disabled={createPending}>
              <KeyRound data-icon="inline-start" />
              {createPending ? "Creando…" : "Crear aplicación y generar token"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aplicaciones registradas</CardTitle>
          <CardDescription>
            Solo se guarda un prefijo del token (<code>hseq_…</code>) para
            identificarlo. Revoca o rota si hay filtración.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actionError && (
            <p className="mb-4 text-sm text-destructive">{actionError}</p>
          )}
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay aplicaciones. Registra la primera para obtener un
              token.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Token (prefijo)</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último uso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.name}</p>
                        {app.description && (
                          <p className="text-xs text-muted-foreground">
                            {app.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{app.tokenPrefix}…</code>
                    </TableCell>
                    <TableCell>
                      {app.revokedAt ? (
                        <Badge variant="destructive">Revocada</Badge>
                      ) : app.active ? (
                        <Badge variant="default">Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {app.lastUsedAt
                        ? app.lastUsedAt.toLocaleString("es-CO")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={Boolean(app.revokedAt) || pendingId}
                          onClick={() => handleRotate(app.id, app.name)}
                        >
                          <RefreshCw data-icon="inline-start" />
                          Rotar token
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={Boolean(app.revokedAt) || pendingId}
                          onClick={() => handleRevoke(app.id, app.name)}
                        >
                          <ShieldOff data-icon="inline-start" />
                          Revocar
                        </Button>
                      </div>
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
          <CardTitle>Uso desde otra app</CardTitle>
          <CardDescription>
            Incluye el token en cada petición con{" "}
            <code>Authorization: Bearer …</code> o la cabecera{" "}
            <code>X-API-Key</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-sm font-medium">Notificación simple (1 variable)</p>
          <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-wrap">
            {notificationExample}
          </pre>
          <p className="mt-4 mb-2 text-sm font-medium">
            HSEQ Cloud — notificación detallada (4 variables)
          </p>
          <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-wrap">
            {notificationDetailExample}
          </pre>
          <p className="mt-3 text-sm text-muted-foreground">
            Configura <code>DETAILED_NOTIFICATION_CONTENT_SID</code> en .env para
            el endpoint detallado. Campañas internas:{" "}
            <code>POST {appUrl}/api/messages/send</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
