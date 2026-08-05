import Link from "next/link"
import { Building2, FileText, Megaphone } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <AppShell
      title="Twilio HSEQ"
      description="Gestión de empresas, empleados, plantillas y campañas."
    >
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/empresas">
            <Building2 data-icon="inline-start" />
            Empresas
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/plantillas">
            <FileText data-icon="inline-start" />
            Plantillas
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/campanas">
            <Megaphone data-icon="inline-start" />
            Campañas
          </Link>
        </Button>
      </div>
    </AppShell>
  )
}
