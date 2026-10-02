import { isTwilioConfigured } from "@/lib/env"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage } from "@/lib/messaging/send-whatsapp"
import {
  resolveTemplateVariableSchema,
  validateStaticVariables,
} from "@/lib/messaging/template-variable-schema"
import { isValidE164Phone, normalizePhoneToE164 } from "@/lib/phone"
import { formatTwilioError } from "@/lib/twilio-errors"

export async function sendTemplateMessageToPhone(
  rawPhone: string,
  templateId: number,
  contentVariables: Record<string, string>
) {
  if (!isTwilioConfigured()) {
    return {
      error: "Twilio no está configurado. Revisa las variables de entorno.",
    }
  }

  const phone = normalizePhoneToE164(rawPhone.trim())
  if (!phone || !isValidE164Phone(phone)) {
    return {
      error:
        "Teléfono inválido. Usa E.164 (+573001234567) o móvil Colombia (3001234567).",
    }
  }

  const template = await prisma.template.findFirst({
    where: {
      id: templateId,
      deletedAt: null,
      status: "approved",
      type: "whatsapp",
    },
  })

  if (!template) {
    return { error: "Plantilla no encontrada o no aprobada." }
  }

  const schema = resolveTemplateVariableSchema(template.variableSchema)
  const { error: staticError } = validateStaticVariables(
    schema,
    contentVariables
  )
  if (staticError) {
    return { error: staticError }
  }

  const message = await prisma.message.create({
    data: {
      templateId: template.id,
      employeeId: null,
      recipientPhone: phone,
      status: "queued",
      contentVariables: JSON.stringify(contentVariables),
    },
  })

  try {
    const twilioMessage = await sendWhatsAppMessage({
      to: phone,
      contentSid: template.contentSid,
      contentVariables,
    })

    await prisma.message.update({
      where: { id: message.id },
      data: {
        messageSid: twilioMessage.sid,
        status: "sent",
        sentAt: new Date(),
      },
    })

    return { success: true, messageSid: twilioMessage.sid, phone }
  } catch (error) {
    const errorMessage = formatTwilioError(error)

    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: "failed",
        errorMessage,
      },
    })

    return { error: errorMessage }
  }
}
