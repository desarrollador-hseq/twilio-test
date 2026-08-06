"use client"

import { startTransition, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { createArea, deleteArea, updateArea } from "@/lib/actions/areas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type AreaItem = {
  id: number
  name: string
  employeeCount: number
}

type CompanyAreasPanelProps = {
  companyId: number
  areas: AreaItem[]
}

export function CompanyAreasPanel({
  companyId,
  areas,
}: CompanyAreasPanelProps) {
  const [newName, setNewName] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)
  const [editing, setEditing] = useState<AreaItem | null>(null)
  const [editName, setEditName] = useState("")
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData()
    formData.append("name", newName)
    setCreateError(null)
    setPending(true)

    startTransition(async () => {
      const result = await createArea(companyId, {}, formData)
      setPending(false)
      if (result.error) {
        setCreateError(result.error)
        return
      }
      setNewName("")
    })
  }

  const handleUpdate = () => {
    if (!editing) return

    const formData = new FormData()
    formData.append("name", editName)
    setEditError(null)
    setPending(true)

    startTransition(async () => {
      const result = await updateArea(companyId, editing.id, {}, formData)
      setPending(false)
      if (result.error) {
        setEditError(result.error)
        return
      }
      setEditing(null)
    })
  }

  const handleDelete = (area: AreaItem) => {
    if (area.employeeCount > 0) {
      setDeleteError(
        `No se puede eliminar "${area.name}": tiene ${area.employeeCount} empleado${area.employeeCount === 1 ? "" : "s"} asignado${area.employeeCount === 1 ? "" : "s"}.`
      )
      return
    }

    if (!confirm(`¿Eliminar el área "${area.name}"?`)) {
      return
    }

    setDeleteError(null)
    setPending(true)

    startTransition(async () => {
      const result = await deleteArea(companyId, area.id)
      setPending(false)
      if (result.error) {
        setDeleteError(result.error)
      }
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Áreas</CardTitle>
          <CardDescription>
            {areas.length === 0
              ? "Aún no hay áreas. Se crean al registrar empleados o desde aquí."
              : `${areas.length} área${areas.length === 1 ? "" : "s"} en esta empresa.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {createError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {createError}
            </p>
          )}
          {deleteError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </p>
          )}

          <form
            onSubmit={handleCreate}
            className="flex flex-wrap items-end gap-2"
          >
            <div className="min-w-[200px] flex-1 space-y-2">
              <Label htmlFor="area-name">Nueva área</Label>
              <Input
                id="area-name"
                name="name"
                placeholder="Ej: Operaciones"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                disabled={pending}
                required
              />
            </div>
            <Button type="submit" disabled={pending || !newName.trim()}>
              <Plus data-icon="inline-start" />
              {pending ? "Guardando..." : "Agregar"}
            </Button>
          </form>

          {areas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay áreas registradas todavía.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Empleados</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell>{area.employeeCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={pending}
                          onClick={() => {
                            setEditing(area)
                            setEditName(area.name)
                            setEditError(null)
                          }}
                        >
                          <Pencil />
                          <span className="sr-only">Editar área</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={pending}
                          onClick={() => handleDelete(area)}
                        >
                          <Trash2 />
                          <span className="sr-only">Eliminar área</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renombrar área</DialogTitle>
            <DialogDescription>
              El nombre se compara en minúsculas para evitar duplicados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-area-name">Nombre</Label>
            <Input
              id="edit-area-name"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              disabled={pending}
            />
            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={pending || !editName.trim()}
            >
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
