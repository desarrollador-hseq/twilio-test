"use client"

import { useActionState, useState } from "react"
import * as XLSX from "xlsx"
import { Download, Upload } from "lucide-react"

import type { BulkImportState } from "@/lib/actions/employees"
import { EMPLOYEE_EXCEL_TEMPLATE_HEADERS } from "@/lib/employees/excel-import"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type EmployeeBulkImportFormProps = {
  action: (
    prevState: BulkImportState,
    formData: FormData
  ) => Promise<BulkImportState>
  cancelHref: string
}

const initialState: BulkImportState = {}

function downloadTemplate() {
  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet([[...EMPLOYEE_EXCEL_TEMPLATE_HEADERS]])
  XLSX.utils.book_append_sheet(workbook, sheet, "Empleados")
  XLSX.writeFile(workbook, "plantilla-empleados.xlsx")
}

export function EmployeeBulkImportForm({
  action,
  cancelHref,
}: EmployeeBulkImportFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const [fileName, setFileName] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Carga masiva por Excel</CardTitle>
          <CardDescription>
            Sube un archivo .xlsx con los empleados. El área se compara en
            minúsculas; si no existe en la empresa, se crea automáticamente.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}

            {state.success && (
              <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                Se importaron {state.created} empleado
                {state.created === 1 ? "" : "s"}
                {state.areasCreated
                  ? ` y se crearon ${state.areasCreated} área${state.areasCreated === 1 ? "" : "s"} nueva${state.areasCreated === 1 ? "" : "s"}`
                  : ""}
                {state.skipped
                  ? `. ${state.skipped} fila${state.skipped === 1 ? "" : "s"} omitida${state.skipped === 1 ? "" : "s"}.`
                  : "."}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="file">Archivo Excel</Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                required
                disabled={pending}
                onChange={(event) =>
                  setFileName(event.target.files?.[0]?.name ?? null)
                }
              />
              {fileName && (
                <p className="text-xs text-muted-foreground">
                  Seleccionado: {fileName}
                </p>
              )}
            </div>

            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Columnas requeridas</p>
              <p className="mt-1">
                nombres, apellidos, cedula, telefono, correo, area
              </p>
              <p className="mt-2">
                Opcionales: telefono, whatsapp, correo_notif (si/no). Sin
                teléfono se registra igual, pero WhatsApp queda deshabilitado.
                Los empleados se crean activos por defecto.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2 border-t">
            <Button type="submit" disabled={pending}>
              <Upload data-icon="inline-start" />
              {pending ? "Importando..." : "Importar empleados"}
            </Button>
            <Button type="button" variant="outline" onClick={downloadTemplate}>
              <Download data-icon="inline-start" />
              Descargar plantilla
            </Button>
            <Button variant="outline" asChild>
              <a href={cancelHref}>Volver</a>
            </Button>
          </CardFooter>
        </form>
      </Card>

      {state.rowErrors && state.rowErrors.length > 0 && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Detalle de filas</CardTitle>
            <CardDescription>
              {state.rowErrors.length} fila
              {state.rowErrors.length === 1 ? "" : "s"} con observaciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
              {state.rowErrors.map((rowError) => (
                <li
                  key={`${rowError.rowNumber}-${rowError.message}`}
                  className="rounded-md border px-3 py-2"
                >
                  <span className="font-medium">
                    Fila {rowError.rowNumber || "—"}:
                  </span>{" "}
                  {rowError.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
