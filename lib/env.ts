export function getAppUrl() {
  // APP_URL y AUTH_URL se leen en runtime (ideal para PM2/producción).
  // NEXT_PUBLIC_APP_URL se embebe en el build y puede quedar desactualizado.
  const configured =
    process.env.APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (configured) {
    return configured.replace(/\/$/, "")
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return "http://localhost:9000"
}

export function isPublicAppUrl(url = getAppUrl()) {
  try {
    const { hostname } = new URL(url)
    return (
      hostname !== "localhost" &&
      hostname !== "127.0.0.1" &&
      !hostname.endsWith(".local")
    )
  } catch {
    return false
  }
}

function getPublicWebhookUrl(path: string) {
  const appUrl = getAppUrl()

  if (!isPublicAppUrl(appUrl)) {
    return undefined
  }

  return `${appUrl}${path}`
}

export function getStatusCallbackUrl() {
  return getPublicWebhookUrl("/api/webhooks/twilio/status")
}

export function getInboundWebhookUrl() {
  return getPublicWebhookUrl("/api/webhooks/twilio/inbound")
}

function parsePositiveIntEnv(value: string | undefined) {
  const raw = value?.trim()
  if (!raw) {
    return null
  }
  const id = Number(raw)
  return Number.isFinite(id) && id > 0 ? id : null
}

/** ID interno (tabla Plantillas) para POST /api/messages/notification */
export function getNotificationTemplateIdFromEnv() {
  return (
    parsePositiveIntEnv(process.env.NOTIFICATION_TEMPLATE_ID) ??
    parsePositiveIntEnv(process.env.ALERT_TEMPLATE_ID)
  )
}

/** Content SID de Twilio; la app busca la plantilla registrada con ese SID */
export function getNotificationContentSidFromEnv() {
  return (
    process.env.NOTIFICATION_CONTENT_SID?.trim() ||
    process.env.ALERT_CONTENT_SID?.trim() ||
    null
  )
}

/** Clave del placeholder estático (p. ej. "1" → {{1}}) con el texto de la notificación */
export function getNotificationTemplateTextVariableKey() {
  return (
    process.env.NOTIFICATION_TEMPLATE_TEXT_VARIABLE_KEY?.trim() ||
    process.env.ALERT_TEMPLATE_TEXT_VARIABLE_KEY?.trim() ||
    "1"
  )
}

/** @deprecated Usa getNotificationTemplateIdFromEnv */
export function getAlertTemplateId() {
  return getNotificationTemplateIdFromEnv()
}

/** @deprecated Usa getNotificationTemplateTextVariableKey */
export function getAlertTemplateTextVariableKey() {
  return getNotificationTemplateTextVariableKey()
}

/** Plantilla detallada: POST /api/messages/hseqcloud/notification-detail */
export function getDetailedNotificationTemplateIdFromEnv() {
  return parsePositiveIntEnv(process.env.DETAILED_NOTIFICATION_TEMPLATE_ID)
}

export function getDetailedNotificationContentSidFromEnv() {
  return process.env.DETAILED_NOTIFICATION_CONTENT_SID?.trim() || null
}

export function isTwilioConfigured() {
  const hasSender = Boolean(
    process.env.TWILIO_WHATSAPP_FROM?.trim() ||
      process.env.TWILIO_MESSAGING_SERVICE_SID?.trim()
  )

  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      hasSender
  )
}

export function getSpacesCdnUrl() {
  return (
    process.env.DO_SPACES_CDN_URL?.trim() ||
    "https://grupohseq.sfo2.cdn.digitaloceanspaces.com"
  )
}

export function getSpacesPrefix() {
  const prefix =
    process.env.DO_SPACES_PREFIX?.trim() || "ws"
  return prefix.replace(/^\/+|\/+$/g, "")
}

export function isSpacesConfigured() {
  return Boolean(
    process.env.DO_SPACES_KEY?.trim() &&
      process.env.DO_SPACES_SECRET?.trim() &&
      process.env.DO_SPACES_BUCKET?.trim() &&
      process.env.DO_SPACES_REGION?.trim()
  )
}

export function getSpacesConfig() {
  const region = process.env.DO_SPACES_REGION?.trim()
  const bucket = process.env.DO_SPACES_BUCKET?.trim()

  if (!isSpacesConfigured() || !region || !bucket) {
    throw new Error("DigitalOcean Spaces no está configurado.")
  }

  const endpoint =
    process.env.DO_SPACES_ENDPOINT?.trim() ||
    `https://${region}.digitaloceanspaces.com`

  return {
    accessKeyId: process.env.DO_SPACES_KEY!.trim(),
    secretAccessKey: process.env.DO_SPACES_SECRET!.trim(),
    bucket,
    region,
    endpoint,
    cdnUrl: getSpacesCdnUrl(),
    prefix: getSpacesPrefix(),
  }
}
