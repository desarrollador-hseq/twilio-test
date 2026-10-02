import { prisma } from "@/lib/prisma"
import {
  serializeVariableSchema,
  type TemplateVariableDef,
} from "@/lib/messaging/template-variable-schema"

export async function ensureTemplateForContentSid(
  contentSid: string,
  friendlyName: string,
  variableSchema: TemplateVariableDef[]
): Promise<number | null> {
  const schemaJson = serializeVariableSchema(variableSchema)

  const active = await prisma.template.findFirst({
    where: {
      contentSid,
      deletedAt: null,
      status: "approved",
      type: "whatsapp",
    },
    select: { id: true },
  })

  if (active) {
    return active.id
  }

  const archived = await prisma.template.findFirst({
    where: { contentSid },
    select: { id: true },
  })

  if (archived) {
    const restored = await prisma.template.update({
      where: { id: archived.id },
      data: {
        deletedAt: null,
        status: "approved",
        type: "whatsapp",
        friendlyName,
        variableSchema: schemaJson,
      },
      select: { id: true },
    })
    return restored.id
  }

  const created = await prisma.template.create({
    data: {
      contentSid,
      friendlyName,
      language: "es",
      type: "whatsapp",
      status: "approved",
      variableSchema: schemaJson,
    },
    select: { id: true },
  })

  return created.id
}
