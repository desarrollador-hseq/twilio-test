export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"

import { getCompany } from "@/lib/actions/companies"
import { getEmployee, updateEmployee } from "@/lib/actions/employees"
import { AppShell } from "@/components/app-shell"
import { EmployeeForm } from "@/components/employees/employee-form"

export default async function EditarEmpleadoPage({
  params,
}: {
  params: Promise<{ id: string; employeeId: string }>
}) {
  const { id, employeeId: employeeIdParam } = await params
  const companyId = Number(id)
  const employeeId = Number(employeeIdParam)

  if (Number.isNaN(companyId) || Number.isNaN(employeeId)) {
    notFound()
  }

  const company = await getCompany(companyId)
  const employee = await getEmployee(companyId, employeeId)

  if (!company || !employee) {
    notFound()
  }

  const updateAction = updateEmployee.bind(null, companyId, employeeId)

  return (
    <AppShell
      title="Editar empleado"
      description={`${employee.firstName} ${employee.lastName} · ${company.legalName}`}
    >
      <EmployeeForm
        action={updateAction}
        defaultValues={{
          firstName: employee.firstName,
          lastName: employee.lastName,
          nationalId: employee.nationalId,
          mobilePhone: employee.mobilePhone,
          email: employee.email,
          active: employee.active,
          canSendWhatsapp: employee.canSendWhatsapp,
          canSendEmail: employee.canSendEmail,
        }}
        submitLabel="Guardar cambios"
        cancelHref={`/empresas/${company.id}`}
        unsubscribeInfo={
          !employee.canSendWhatsapp && employee.unsubscribedAt
            ? {
                unsubscribedAt: employee.unsubscribedAt,
                unsubscribeReason: employee.unsubscribeReason,
              }
            : undefined
        }
      />
    </AppShell>
  )
}
