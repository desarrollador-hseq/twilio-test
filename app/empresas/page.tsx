"use server"

import Link from "next/link"
import { Plus, Users } from "lucide-react"

import { getCompanies } from "@/lib/actions/companies"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

export default async function EmpresasPage() {
  const companies = await getCompanies()

  return (
    <AppShell
      title="Empresas"
      description="Administra las empresas y sus empleados."
      actions={
        <Button asChild>
          <Link href="/empresas/nueva">
            <Plus data-icon="inline-start" />
            Nueva empresa
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>
            {companies.length === 0
              ? "Aún no hay empresas registradas."
              : `${companies.length} empresa${companies.length === 1 ? "" : "s"} registrada${companies.length === 1 ? "" : "s"}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-md border border-dashed p-8">
              <p className="text-sm text-muted-foreground">
                Crea la primera empresa para comenzar a registrar empleados.
              </p>
              <Button asChild>
                <Link href="/empresas/nueva">Registrar empresa</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razón social</TableHead>
                  <TableHead>NIT</TableHead>
                  <TableHead>Empleados</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/empresas/${company.id}`}
                        className="hover:underline"
                      >
                        {company.legalName}
                      </Link>
                    </TableCell>
                    <TableCell>{company.taxId}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <Users data-icon="inline-start" />
                        {company._count.employees}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/empresas/${company.id}`}>Ver detalle</Link>
                      </Button>
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
