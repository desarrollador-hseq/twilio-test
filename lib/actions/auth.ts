"use server"

import { AuthError } from "next-auth"

import type { ActionState } from "@/lib/actions/types"
import { signIn } from "@/lib/auth"

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Correo o contraseña incorrectos." }
    }

    throw error
  }

  return {}
}

export async function signOutAction() {
  const { signOut } = await import("@/lib/auth")
  await signOut({ redirectTo: "/login" })
}
