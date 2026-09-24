export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil, Plus, Upload } from "lucide-react"

import { getCompany } from "@/lib/actions/companies"
import { unsubscribeReasonLabel } from "@/lib/labels"
import { AppShell } from "@/components/app-shell"
import { DeleteCompanyButton } from "@/components/companies/delete-company-button"
import { EmployeeRowActions } from "@/components/employees/employee-row-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function EmpresaDetallePage({
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

  return (
    <AppShell
      title={company.legalName}
      description={`NIT ${company.taxId}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/empresas/${company.id}/editar`}>
              <Pencil data-icon="inline-start" />
              Editar empresa
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/empresas/${company.id}/empleados/nuevo`}>
              <Plus data-icon="inline-start" />
              Nuevo empleado
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/empresas/${company.id}/empleados/carga-masiva`}>
              <Upload data-icon="inline-start" />
              Carga masiva
            </Link>
          </Button>
          <DeleteCompanyButton companyId={company.id} />
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Empleados</CardTitle>
          <CardDescription>
            {company.employees.length === 0
              ? "Esta empresa aún no tiene empleados."
              : `${company.employees.length} empleado${company.employees.length === 1 ? "" : "s"} registrado${company.employees.length === 1 ? "" : "s"}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {company.employees.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-md border border-dashed p-8">
              <p className="text-sm text-muted-foreground">
                Agrega el primer empleado de esta empresa.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={`/empresas/${company.id}/empleados/nuevo`}>
                    Registrar empleado
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/empresas/${company.id}/empleados/carga-masiva`}>
                    Carga masiva Excel
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Notificaciones</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </TableCell>
                    <TableCell>{employee.nationalId}</TableCell>
                    <TableCell>
                      {employee.area?.name ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{employee.mobilePhone}</p>
                        <p className="text-muted-foreground">{employee.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.active ? "default" : "secondary"}>
                        {employee.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {employee.canSendWhatsapp && (
                            <Badge variant="outline">WhatsApp</Badge>
                          )}
                          {employee.canSendEmail && (
                            <Badge variant="outline">Correo</Badge>
                          )}
                          {!employee.canSendWhatsapp &&
                            !employee.canSendEmail && (
                              <span className="text-muted-foreground">—</span>
                            )}
                        </div>
                        {!employee.canSendWhatsapp &&
                          employee.unsubscribedAt && (
                            <p className="text-xs text-muted-foreground">
                              Baja WhatsApp ·{" "}
                              {employee.unsubscribedAt.toLocaleString("es-CO")}
                              {employee.unsubscribeReason &&
                                ` · ${unsubscribeReasonLabel(employee.unsubscribeReason)}`}
                            </p>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <EmployeeRowActions
                        companyId={company.id}
                        employeeId={employee.id}
                        active={employee.active}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  )
}
