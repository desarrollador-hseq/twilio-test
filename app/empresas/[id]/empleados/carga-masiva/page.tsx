export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"

import { getCompany } from "@/lib/actions/companies"
import { importEmployeesFromExcel } from "@/lib/actions/employees"
import { AppShell } from "@/components/app-shell"
import { EmployeeBulkImportForm } from "@/components/employees/employee-bulk-import-form"

export default async function CargaMasivaEmpleadosPage({
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

  const importAction = importEmployeesFromExcel.bind(null, companyId)

  return (
    <AppShell
      title="Carga masiva de empleados"
      description={`Empresa: ${company.legalName}`}
    >
      <EmployeeBulkImportForm
        action={importAction}
        cancelHref={`/empresas/${company.id}`}
      />
    </AppShell>
  )
}
