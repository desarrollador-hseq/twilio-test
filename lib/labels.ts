const TEMPLATE_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
}

const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sending: "Enviando",
  completed: "Completada",
  failed: "Fallida",
}

const MESSAGE_STATUS_LABELS: Record<string, string> = {
  queued: "En cola",
  sent: "Enviado",
  delivered: "Entregado",
  read: "Leído",
  failed: "Fallido",
  undelivered: "No entregado",
}

export function templateStatusLabel(status: string) {
  return TEMPLATE_STATUS_LABELS[status] ?? status
}

export function campaignStatusLabel(status: string) {
  return CAMPAIGN_STATUS_LABELS[status] ?? status
}

export function messageStatusLabel(status: string) {
  return MESSAGE_STATUS_LABELS[status] ?? status
}

const UNSUBSCRIBE_REASON_LABELS: Record<string, string> = {
  admin: "Administrador",
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  USER: "Usuario",
}

export function roleLabel(role: string) {
  return ROLE_LABELS[role] ?? role
}

export function unsubscribeReasonLabel(reason: string | null | undefined) {
  if (!reason) {
    return null
  }

  if (reason.startsWith("keyword:")) {
    return `Palabra clave: ${reason.slice("keyword:".length)}`
  }

  return UNSUBSCRIBE_REASON_LABELS[reason] ?? reason
}
