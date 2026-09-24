"use server"

import { revalidatePath } from "next/cache"

import type { ActionState } from "@/lib/actions/types"
import { sendIndividualMessage } from "@/lib/actions/campaigns"
import { getTemplate } from "@/lib/actions/templates"
import { prisma } from "@/lib/prisma"
import {
  parseCampaignStaticVariables,
  resolveTemplateVariableSchema,
} from "@/lib/messaging/template-variable-schema"

export async function getEmployeesForTemplateTest(templateId: number) {
  const template = await getTemplate(templateId)
  if (!template) {
    return []
  }

  return prisma.employee.findMany({
    where: {
      deletedAt: null,
      active: true,
      canSendWhatsapp: true,
      ...(template.companyId ? { companyId: template.companyId } : {}),
    },
    include: { company: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  })
}

export async function sendTemplateTestMessage(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState & { messageSid?: string }> {
  const templateId = Number(formData.get("templateId"))
  const employeeId = Number(formData.get("employeeId"))

  if (Number.isNaN(templateId) || Number.isNaN(employeeId)) {
    return { error: "Selecciona plantilla y empleado." }
  }

  const template = await getTemplate(templateId)
  if (!template) {
    return { error: "Plantilla no encontrada." }
  }

  const schema = resolveTemplateVariableSchema(template.variableSchema)
  const { values: staticVars, error: staticError } =
    parseCampaignStaticVariables(formData, schema)

  if (staticError) {
    return { error: staticError }
  }

  const result = await sendIndividualMessage(
    employeeId,
    templateId,
    staticVars
  )

  if (result.error) {
    return { error: result.error }
  }

  revalidatePath(`/plantillas/${templateId}`)
  revalidatePath(`/plantillas/${templateId}/enviar`)

  return {
    success: true,
    messageSid: result.messageSid,
  }
}
