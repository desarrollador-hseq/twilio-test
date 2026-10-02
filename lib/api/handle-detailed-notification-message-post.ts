import { NextRequest, NextResponse } from "next/server"

import { authenticateMessagesApiRequest } from "@/lib/api/messages-api-auth"
import {
  getDetailedNotificationContentSidFromEnv,
  getDetailedNotificationTemplateIdFromEnv,
} from "@/lib/env"
import {
  buildDetailedNotificationContentVariables,
  resolveDetailedNotificationTemplateId,
} from "@/lib/messaging/detailed-notification-template"
import { sendTemplateMessageToPhone } from "@/lib/messaging/send-template-message-to-phone"

const MAX_FIELD_LENGTH = 1024

type DetailedNotificationRequestBody = {
  phone?: string
  recipientName?: string
  companyName?: string
  subject?: string
  message?: string
  templateId?: number
}

function parseTemplateId(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null
  }
  const id = typeof value === "number" ? value : Number(value)
  return Number.isFinite(id) && id > 0 ? id : null
}

function readRequiredString(
  value: unknown,
  field: string
): { value: string } | { error: string } {
  const text = typeof value === "string" ? value.trim() : ""
  if (!text) {
    return { error: `${field} es obligatorio.` }
  }
  if (text.length > MAX_FIELD_LENGTH) {
    return {
      error: `${field} no puede superar ${MAX_FIELD_LENGTH} caracteres.`,
    }
  }
  return { value: text }
}

export async function handleDetailedNotificationMessagePost(
  request: NextRequest
) {
  const authResult = await authenticateMessagesApiRequest(request)
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    )
  }

  let body: DetailedNotificationRequestBody
  try {
    body = (await request.json()) as DetailedNotificationRequestBody
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 })
  }

  const phoneField = readRequiredString(body.phone, "phone")
  if ("error" in phoneField) {
    return NextResponse.json({ error: phoneField.error }, { status: 400 })
  }

  const recipientName = readRequiredString(body.recipientName, "recipientName")
  if ("error" in recipientName) {
    return NextResponse.json({ error: recipientName.error }, { status: 400 })
  }

  const companyName = readRequiredString(body.companyName, "companyName")
  if ("error" in companyName) {
    return NextResponse.json({ error: companyName.error }, { status: 400 })
  }

  const subject = readRequiredString(body.subject, "subject")
  if ("error" in subject) {
    return NextResponse.json({ error: subject.error }, { status: 400 })
  }

  const messageField = readRequiredString(body.message, "message")
  if ("error" in messageField) {
    return NextResponse.json({ error: messageField.error }, { status: 400 })
  }

  const templateId = await resolveDetailedNotificationTemplateId(
    parseTemplateId(body.templateId)
  )
  if (!templateId) {
    const hasSid = Boolean(getDetailedNotificationContentSidFromEnv())
    const hasTemplateId = Boolean(getDetailedNotificationTemplateIdFromEnv())

    if (!hasSid && !hasTemplateId) {
      return NextResponse.json(
        {
          error:
            "Falta DETAILED_NOTIFICATION_CONTENT_SID o DETAILED_NOTIFICATION_TEMPLATE_ID en .env.",
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        error:
          "No se pudo resolver la plantilla de notificación detallada. Revisa el Content SID en .env.",
      },
      { status: 500 }
    )
  }

  const contentVariables = buildDetailedNotificationContentVariables({
    recipientName: recipientName.value,
    companyName: companyName.value,
    subject: subject.value,
    message: messageField.value,
  })

  const result = await sendTemplateMessageToPhone(
    phoneField.value,
    templateId,
    contentVariables
  )

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    ...result,
    application: authResult.application.name,
  })
}
