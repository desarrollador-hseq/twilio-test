export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"

import { getCompany } from "@/lib/actions/companies"
import { createEmployee } from "@/lib/actions/employees"
import { AppShell } from "@/components/app-shell"
import { EmployeeForm } from "@/components/employees/employee-form"

export default async function NuevoEmpleadoPage({
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

  const createAction = createEmployee.bind(null, companyId)

  return (
    <AppShell
      title="Nuevo empleado"
      description={`Empresa: ${company.legalName}`}
    >
      <EmployeeForm
        action={createAction}
        submitLabel="Registrar empleado"
        cancelHref={`/empresas/${company.id}`}
      />
    </AppShell>
  )
}
