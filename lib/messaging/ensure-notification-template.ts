import { ensureTemplateForContentSid } from "@/lib/messaging/ensure-template-for-content-sid"
import type { TemplateVariableDef } from "@/lib/messaging/template-variable-schema"

const NOTIFICATION_VARIABLE_SCHEMA: TemplateVariableDef[] = [
  {
    key: "1",
    label: "Texto de la notificación",
    kind: "static",
    input: "textarea",
    required: true,
  },
]

export async function ensureNotificationTemplateForContentSid(
  contentSid: string
): Promise<number | null> {
  return ensureTemplateForContentSid(
    contentSid,
    "Notificación WhatsApp (API)",
    NOTIFICATION_VARIABLE_SCHEMA
  )
}
