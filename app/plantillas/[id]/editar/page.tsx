export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"

import { getCompanies } from "@/lib/actions/companies"
import { getTemplate, updateTemplate } from "@/lib/actions/templates"
import { AppShell } from "@/components/app-shell"
import { TemplateForm } from "@/components/templates/template-form"

export default async function EditarPlantillaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const templateId = Number(id)

  if (Number.isNaN(templateId)) {
    notFound()
  }

  const [template, companies] = await Promise.all([
    getTemplate(templateId),
    getCompanies(),
  ])

  if (!template) {
    notFound()
  }

  const updateAction = updateTemplate.bind(null, templateId)

  return (
    <AppShell
      title="Editar plantilla"
      description={template.friendlyName}
    >
      <TemplateForm
        action={updateAction}
        companies={companies}
        defaultValues={{
          contentSid: template.contentSid,
          friendlyName: template.friendlyName,
          language: template.language,
          category: template.category ?? undefined,
          type: template.type,
          status: template.status,
          mediaBaseUrl: template.mediaBaseUrl,
          mediaFileName: template.mediaFileName,
          companyId: template.companyId,
        }}
        submitLabel="Guardar cambios"
        cancelHref={`/plantillas/${template.id}`}
      />
    </AppShell>
  )
}
