"use server"

import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { encode } from "@auth/core/jwt"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = (formData.get("email") as string)?.trim()
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email et mot de passe requis" }
  }

  // Vérification des credentials en base
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.password) {
    return { error: "Email ou mot de passe incorrect" }
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    return { error: "Email ou mot de passe incorrect" }
  }

  // Création du JWT compatible NextAuth v5
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? ""
  const cookieName = "authjs.session-token"
  const token = await encode({
    token: {
      sub: user.id,
      email: user.email ?? "",
      name: user.name ?? "",
      id: user.id,
      role: user.role ?? "user",
    },
    secret,
    salt: cookieName,
    maxAge: 30 * 24 * 60 * 60,
  })

  // Pose du cookie de session
  const cookieStore = await cookies()
  cookieStore.set("authjs.session-token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  })

  redirect("/dashboard")
}
