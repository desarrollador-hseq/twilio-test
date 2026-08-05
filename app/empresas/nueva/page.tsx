import { createCompany } from "@/lib/actions/companies"
import { AppShell } from "@/components/app-shell"
import { CompanyForm } from "@/components/companies/company-form"

export default function NuevaEmpresaPage() {
  return (
    <AppShell
      title="Nueva empresa"
      description="Registra una empresa para asociar empleados."
    >
      <CompanyForm
        action={createCompany}
        submitLabel="Crear empresa"
        cancelHref="/empresas"
      />
    </AppShell>
  )
}
