export const dynamic = "force-dynamic"

import { createCampaign } from "@/lib/actions/campaigns"
import { getCompanies } from "@/lib/actions/companies"
import { getApprovedTemplates } from "@/lib/actions/templates"
import { AppShell } from "@/components/app-shell"
import { CampaignForm } from "@/components/campaigns/campaign-form"

export default async function NuevaCampanaPage() {
  const [companies, templates] = await Promise.all([
    getCompanies(),
    getApprovedTemplates(),
  ])

  return (
    <AppShell
      title="Nueva campaña"
      description="Configura un envío masivo para una empresa."
    >
      <CampaignForm
        action={createCampaign}
        companies={companies}
        templates={templates.map((t) => ({
          id: t.id,
          friendlyName: t.friendlyName,
          contentSid: t.contentSid,
          companyId: t.companyId,
          mediaFileName: t.mediaFileName,
          mediaBaseUrl: t.mediaBaseUrl,
        }))}
        submitLabel="Crear campaña"
        cancelHref="/campanas"
      />
    </AppShell>
  )
}
