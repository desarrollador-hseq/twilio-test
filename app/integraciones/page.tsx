export const dynamic = "force-dynamic"

import { getApiApplications } from "@/lib/actions/api-applications"
import { AppShell } from "@/components/app-shell"
import { ApiApplicationsPanel } from "@/components/integrations/api-applications-panel"
import { requireAdminSession } from "@/lib/auth/require-admin"
import { getAppUrl } from "@/lib/env"

export default async function IntegracionesPage() {
  await requireAdminSession()
  const applications = await getApiApplications()

  return (
    <AppShell
      title="Integraciones API"
      description="Registra aplicaciones externas y emite tokens para enviar mensajes por WhatsApp."
    >
      <ApiApplicationsPanel applications={applications} appUrl={getAppUrl()} />
    </AppShell>
  )
}
