export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"

import { getCompany, updateCompany } from "@/lib/actions/companies"
import { AppShell } from "@/components/app-shell"
import { CompanyAreasPanel } from "@/components/companies/company-areas-panel"
import { CompanyForm } from "@/components/companies/company-form"

export default async function EditarEmpresaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const companyId = Number(id)

  if (Number.isNaN(companyId)) {
    notFound()
  }

  const company = await getCompany(companyId)

  if (!company) {
    notFound()
  }

  const updateAction = updateCompany.bind(null, companyId)

  return (
    <AppShell
      title="Editar empresa"
      description={company.legalName}
    >
      <div className="space-y-6">
        <CompanyForm
          action={updateAction}
          defaultValues={{
            legalName: company.legalName,
            taxId: company.taxId,
          }}
          submitLabel="Guardar cambios"
          cancelHref={`/empresas/${company.id}`}
        />
        <CompanyAreasPanel
          companyId={company.id}
          areas={company.areas.map((area) => ({
            id: area.id,
            name: area.name,
            employeeCount: area._count.employees,
          }))}
        />
      </div>
    </AppShell>
  )
}
