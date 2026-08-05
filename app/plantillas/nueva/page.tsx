export const dynamic = "force-dynamic"

import { createTemplate } from "@/lib/actions/templates"
import { getCompanies } from "@/lib/actions/companies"
import { AppShell } from "@/components/app-shell"
import { TemplateForm } from "@/components/templates/template-form"

export default async function NuevaPlantillaPage() {
  const companies = await getCompanies()

  return (
    <AppShell
      title="Nueva plantilla"
      description="Registra una plantilla aprobada de Twilio."
    >
      <TemplateForm
        action={createTemplate}
        companies={companies}
        submitLabel="Registrar plantilla"
        cancelHref="/plantillas"
      />
    </AppShell>
  )
}
