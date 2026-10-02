import { getNotificationTemplateTextVariableKey } from "@/lib/env"
import { sendTemplateMessageToPhone } from "@/lib/messaging/send-template-message-to-phone"

export async function sendNotificationToPhone(
  rawPhone: string,
  text: string,
  templateId: number
) {
  return sendTemplateMessageToPhone(rawPhone, templateId, {
    [getNotificationTemplateTextVariableKey()]: text,
  })
}
