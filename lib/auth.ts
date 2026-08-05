import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

import { authConfig } from "@/lib/auth.config"
import { verifyUserCredentials } from "@/lib/auth/verify-credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase()
        const password = credentials?.password?.toString()

        if (!email || !password) {
          return null
        }

        return verifyUserCredentials(email, password)
      },
    }),
  ],
})
