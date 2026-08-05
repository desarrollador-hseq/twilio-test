import { signOutAction } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" size="sm">
        Cerrar sesión
      </Button>
    </form>
  )
}
