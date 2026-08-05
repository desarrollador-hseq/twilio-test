import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-heading text-lg font-medium">Twilio HSEQ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión de campañas y mensajería
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
