export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"

import { getEmployeesForTemplateTest } from "@/lib/actions/messages"
import { getTemplate } from "@/lib/actions/templates"
import { AppShell } from "@/components/app-shell"
import { SendTemplateTestForm } from "@/components/templates/send-template-test-form"

export default async function EnviarPlantillaPruebaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const templateId = Number(id)

  if (Number.isNaN(templateId)) {
    notFound()
  }

  const [template, employees] = await Promise.all([
    getTemplate(templateId),
    getEmployeesForTemplateTest(templateId),
  ])

  if (!template) {
    notFound()
  }

  if (template.status !== "approved" || template.type !== "whatsapp") {
    notFound()
  }

  return (
    <AppShell
      title="Enviar prueba"
      description={`Plantilla: ${template.friendlyName}`}
    >
      <SendTemplateTestForm
        templateId={template.id}
        templateName={template.friendlyName}
        variableSchema={template.variableSchema}
        employees={employees}
        cancelHref={`/plantillas/${template.id}`}
      />
    </AppShell>
  )
}
