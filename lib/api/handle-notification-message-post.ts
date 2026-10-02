import { NextRequest, NextResponse } from "next/server"

import { authenticateMessagesApiRequest } from "@/lib/api/messages-api-auth"
import {
  getNotificationContentSidFromEnv,
  getNotificationTemplateIdFromEnv,
} from "@/lib/env"
import { resolveNotificationTemplateId } from "@/lib/messaging/resolve-notification-template"
import { sendNotificationToPhone } from "@/lib/messaging/send-notification-to-phone"

const MAX_NOTIFICATION_TEXT_LENGTH = 1024

type NotificationRequestBody = {
  phone?: string
  text?: string
  templateId?: number
}

function parseTemplateId(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null
  }
  const id = typeof value === "number" ? value : Number(value)
  return Number.isFinite(id) && id > 0 ? id : null
}

export async function handleNotificationMessagePost(request: NextRequest) {
  const authResult = await authenticateMessagesApiRequest(request)
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    )
  }

  let body: NotificationRequestBody
  try {
    body = (await request.json()) as NotificationRequestBody
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 })
  }

  const phone =
    typeof body.phone === "string" ? body.phone.trim() : ""
  if (!phone) {
    return NextResponse.json(
      { error: "phone es obligatorio." },
      { status: 400 }
    )
  }

  const text = typeof body.text === "string" ? body.text.trim() : ""
  if (!text) {
    return NextResponse.json(
      { error: "text es obligatorio (contenido de {{1}} en la plantilla)." },
      { status: 400 }
    )
  }

  if (text.length > MAX_NOTIFICATION_TEXT_LENGTH) {
    return NextResponse.json(
      {
        error: `text no puede superar ${MAX_NOTIFICATION_TEXT_LENGTH} caracteres.`,
      },
      { status: 400 }
    )
  }

  const templateId = await resolveNotificationTemplateId(
    parseTemplateId(body.templateId)
  )
  if (!templateId) {
    const hasSid = Boolean(getNotificationContentSidFromEnv())
    const hasTemplateId = Boolean(getNotificationTemplateIdFromEnv())

    if (!hasSid && !hasTemplateId) {
      return NextResponse.json(
        {
          error:
            "Falta NOTIFICATION_CONTENT_SID o NOTIFICATION_TEMPLATE_ID en .env. Reinicia el servidor después de editar el archivo.",
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        error:
          "No se pudo resolver la plantilla de notificación. Revisa NOTIFICATION_CONTENT_SID y que la base de datos esté accesible.",
      },
      { status: 500 }
    )
  }

  const result = await sendNotificationToPhone(phone, text, templateId)

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    ...result,
    application: authResult.application.name,
  })
}
