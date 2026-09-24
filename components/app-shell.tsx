import Link from "next/link"
import { Building2, FileText, LayoutDashboard, Megaphone } from "lucide-react"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { auth } from "@/lib/auth"
import { roleLabel } from "@/lib/labels"

export async function AppShell({
  children,
  title,
  description,
  actions,
}: {
  children: React.ReactNode
  title?: string
  description?: string
  actions?: React.ReactNode
}) {
  const session = await auth()

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-6">
          <Link href="/" className="font-medium">
            Twilio HSEQ
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <LayoutDashboard data-icon="inline-start" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/empresas">
              <Building2 data-icon="inline-start" />
              Empresas
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/plantillas">
              <FileText data-icon="inline-start" />
              Plantillas
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/campanas">
              <Megaphone data-icon="inline-start" />
              Campañas
            </Link>
          </Button>
          {session?.user && (
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right text-xs">
                <p className="font-medium">{session.user.name}</p>
                <p className="text-muted-foreground">
                  {roleLabel(session.user.role)}
                </p>
              </div>
              <SignOutButton />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {(title || actions) && (
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              {title && (
                <h1 className="font-heading text-lg font-medium">{title}</h1>
              )}
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {actions}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
