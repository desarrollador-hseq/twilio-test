import {
  getNotificationContentSidFromEnv,
  getNotificationTemplateIdFromEnv,
} from "@/lib/env"
import { ensureNotificationTemplateForContentSid } from "@/lib/messaging/ensure-notification-template"
import { prisma } from "@/lib/prisma"

/** Plantilla por defecto para POST /api/messages/notification. */
export async function resolveNotificationTemplateId(
  explicitTemplateId: number | null
): Promise<number | null> {
  if (explicitTemplateId) {
    return explicitTemplateId
  }

  const fromEnv = getNotificationTemplateIdFromEnv()
  if (fromEnv) {
    return fromEnv
  }

  const contentSid = getNotificationContentSidFromEnv()
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

  return ensureNotificationTemplateForContentSid(contentSid)
}
