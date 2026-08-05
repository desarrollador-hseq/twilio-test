"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import type { ActionState } from "@/lib/actions/types"
import { isTwilioConfigured } from "@/lib/env"
import { sendWhatsAppMessage } from "@/lib/messaging/send-whatsapp"
import { formatTwilioError } from "@/lib/twilio-errors"
import { CAMPAIGN_CHANNELS } from "@/lib/messaging/constants"
import {
  buildContentVariablesForEmployee,
  resolveMediaFileName,
} from "@/lib/messaging/content-variables"
import { syncMissingTwilioMessageErrors } from "@/lib/messaging/sync-message-errors"

function parseCampaignForm(formData: FormData) {
  const companyId = Number(formData.get("companyId"))
  const templateId = Number(formData.get("templateId"))

  return {
    name: formData.get("name")?.toString().trim() ?? "",
    companyId,
    templateId,
    channel: formData.get("channel")?.toString().trim() || "whatsapp",
    mediaFileName: formData.get("mediaFileName")?.toString().trim() || null,
    contentVariables: null,
  }
}

function validateCampaignInput(input: ReturnType<typeof parseCampaignForm>) {
  if (!input.name) {
    return "El nombre de la campaña es obligatorio."
  }

  if (Number.isNaN(input.companyId) || Number.isNaN(input.templateId)) {
    return "Selecciona empresa y plantilla."
  }

  if (
    !CAMPAIGN_CHANNELS.includes(
      input.channel as (typeof CAMPAIGN_CHANNELS)[number]
    )
  ) {
    return "Canal inválido."
  }

  return null
}

export async function getCampaigns() {
  return prisma.campaign.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      company: true,
      template: true,
      _count: { select: { messages: true } },
    },
  })
}

export async function getCampaign(id: number) {
  const campaign = await prisma.campaign.findFirst({
    where: { id, deletedAt: null },
    include: {
      company: true,
      template: true,
      messages: {
        orderBy: { createdAt: "desc" },
        include: {
          employee: true,
        },
      },
    },
  })

  if (!campaign) {
    return null
  }

  await syncMissingTwilioMessageErrors(campaign.messages)

  return campaign
}

export async function createCampaign(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const input = parseCampaignForm(formData)
  const validationError = validateCampaignInput(input)
  if (validationError) {
    return { error: validationError }
  }

  const [company, template] = await Promise.all([
    prisma.company.findFirst({
      where: { id: input.companyId, deletedAt: null },
    }),
    prisma.template.findFirst({
      where: { id: input.templateId, deletedAt: null, status: "approved" },
    }),
  ])

  if (!company) {
    return { error: "La empresa seleccionada no existe." }
  }

  if (!template) {
    return { error: "La plantilla seleccionada no existe o no está aprobada." }
  }

  if (template.type !== "whatsapp" && input.channel === "whatsapp") {
    return { error: "La plantilla no es compatible con WhatsApp." }
  }

  const mediaFileName = input.mediaFileName
    ? resolveMediaFileName(
        input.mediaFileName,
        null,
        template.mediaBaseUrl
      )
    : null

  let campaignId: number

  try {
    const campaign = await prisma.campaign.create({
      data: {
        name: input.name,
        companyId: input.companyId,
        templateId: input.templateId,
        channel: input.channel,
        mediaFileName,
        contentVariables: input.contentVariables,
        status: "draft",
      },
    })
    campaignId = campaign.id
  } catch (error) {
    console.error("createCampaign failed:", error)
    return { error: "No se pudo crear la campaña." }
  }

  revalidatePath("/campanas")
  redirect(`/campanas/${campaignId}`)
}

export async function launchCampaign(campaignId: number) {
  if (!isTwilioConfigured()) {
    return { error: "Twilio no está configurado. Revisa las variables de entorno." }
  }

  const campaign = await getCampaign(campaignId)
  if (!campaign) {
    return { error: "La campaña no existe o fue eliminada." }
  }

  if (campaign.status !== "draft") {
    return { error: "Solo se pueden lanzar campañas en borrador." }
  }

  if (campaign.channel !== "whatsapp") {
    return { error: "Por ahora solo se soporta el canal WhatsApp." }
  }

  const mediaFileName = resolveMediaFileName(
    campaign.mediaFileName,
    campaign.template.mediaFileName,
    campaign.template.mediaBaseUrl
  )

  const employees = await prisma.employee.findMany({
    where: {
      companyId: campaign.companyId,
      active: true,
      deletedAt: null,
      canSendWhatsapp: true,
    },
  })

  if (employees.length === 0) {
    return {
      error: "No hay empleados elegibles para WhatsApp en esta empresa.",
    }
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "sending" },
  })

  let successCount = 0
  let failureCount = 0

  for (const employee of employees) {
    const contentVariables = buildContentVariablesForEmployee(employee, {
      mediaFileName,
      mediaBaseUrl: campaign.template.mediaBaseUrl,
    })

    const message = await prisma.message.create({
      data: {
        campaignId,
        employeeId: employee.id,
        templateId: campaign.templateId,
        status: "queued",
        contentVariables: contentVariables
          ? JSON.stringify(contentVariables)
          : null,
      },
    })

    try {
      const twilioMessage = await sendWhatsAppMessage({
        to: employee.mobilePhone,
        contentSid: campaign.template.contentSid,
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
      successCount++
    } catch (error) {
      const errorMessage = formatTwilioError(error)

      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: "failed",
          errorMessage,
        },
      })
      failureCount++
    }
  }

  const finalStatus = failureCount === employees.length ? "failed" : "completed"

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: finalStatus,
      sentAt: new Date(),
    },
  })

  revalidatePath("/campanas")
  revalidatePath(`/campanas/${campaignId}`)

  return {
    success: true,
    sent: successCount,
    failed: failureCount,
    total: employees.length,
  }
}

export async function sendIndividualMessage(
  employeeId: number,
  templateId: number
) {
  if (!isTwilioConfigured()) {
    return { error: "Twilio no está configurado. Revisa las variables de entorno." }
  }

  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      deletedAt: null,
      active: true,
      canSendWhatsapp: true,
    },
  })

  if (!employee) {
    return { error: "Empleado no encontrado o no elegible para WhatsApp." }
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

  const mediaFileName = resolveMediaFileName(
    null,
    template.mediaFileName,
    template.mediaBaseUrl
  )

  const contentVariables = buildContentVariablesForEmployee(employee, {
    mediaFileName,
    mediaBaseUrl: template.mediaBaseUrl,
  })

  const message = await prisma.message.create({
    data: {
      employeeId: employee.id,
      templateId: template.id,
      status: "queued",
      contentVariables: contentVariables
        ? JSON.stringify(contentVariables)
        : null,
    },
  })

  try {
    const twilioMessage = await sendWhatsAppMessage({
      to: employee.mobilePhone,
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

    return { success: true, messageSid: twilioMessage.sid }
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
