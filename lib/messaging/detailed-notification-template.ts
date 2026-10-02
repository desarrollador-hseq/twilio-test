import {
  getDetailedNotificationContentSidFromEnv,
  getDetailedNotificationTemplateIdFromEnv,
} from "@/lib/env"
import { ensureTemplateForContentSid } from "@/lib/messaging/ensure-template-for-content-sid"
import type { TemplateVariableDef } from "@/lib/messaging/template-variable-schema"
import { prisma } from "@/lib/prisma"

/** Hola {{1}}, … notificación de {{2}} … Asunto: {{3}} … {{4}} */
export const DETAILED_NOTIFICATION_VARIABLE_SCHEMA: TemplateVariableDef[] = [
  {
    key: "1",
    label: "Nombre del destinatario",
    kind: "static",
    input: "text",
    required: true,
  },
  {
    key: "2",
    label: "Empresa o remitente",
    kind: "static",
    input: "text",
    required: true,
  },
  {
    key: "3",
    label: "Asunto",
    kind: "static",
    input: "text",
    required: true,
  },
  {
    key: "4",
    label: "Detalle del mensaje",
    kind: "static",
    input: "textarea",
    required: true,
  },
]

export async function ensureDetailedNotificationTemplateForContentSid(
  contentSid: string
): Promise<number | null> {
  return ensureTemplateForContentSid(
    contentSid,
    "Notificación detallada (API externa)",
    DETAILED_NOTIFICATION_VARIABLE_SCHEMA
  )
}

export async function resolveDetailedNotificationTemplateId(
  explicitTemplateId: number | null
): Promise<number | null> {
  if (explicitTemplateId) {
    return explicitTemplateId
  }

  const fromEnv = getDetailedNotificationTemplateIdFromEnv()
  if (fromEnv) {
    return fromEnv
  }

  const contentSid = getDetailedNotificationContentSidFromEnv()
  if (!contentSid) {
    return null
  }

  const template = await prisma.template.findFirst({
    where: {
      contentSid,
      deletedAt: null,
      status: "approved",
      type: "whatsapp",
    },
    select: { id: true },
  })

  if (template) {
    return template.id
  }

  return ensureDetailedNotificationTemplateForContentSid(contentSid)
}

export function buildDetailedNotificationContentVariables(input: {
  recipientName: string
  companyName: string
  subject: string
  message: string
}): Record<string, string> {
  return {
    "1": input.recipientName,
    "2": input.companyName,
    "3": input.subject,
    "4": input.message,
  }
}
