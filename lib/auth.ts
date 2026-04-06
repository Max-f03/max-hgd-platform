import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("========== AUTH DEBUG ==========")

        if (!credentials?.email || !credentials?.password) {
          console.log("ERROR: Missing credentials")
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        console.log("Looking for user:", email)

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          console.log("ERROR: User not found")
          return null
        }

        if (!user.password) {
          console.log("ERROR: User has no password")
          return null
        }

        console.log("User found, comparing passwords...")

        const isValid = await bcrypt.compare(password, user.password)

        console.log("Password valid:", isValid)

        if (!isValid) {
          console.log("ERROR: Invalid password")
          return null
        }

        console.log("SUCCESS! Returning user")
        console.log("================================")

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if (user.id) {
          token.id = user.id
        }
        const role = (user as { role?: string }).role
        if (role) {
          token.role = role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})
