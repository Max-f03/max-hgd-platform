import { decode } from "@auth/core/jwt"
import { cookies } from "next/headers"
import {
  getDashboardStats,
  getRecentActivity,
  getTeamStats,
  calculateTimePercentages,
} from "@/lib/dashboard-stats"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"

async function getSession() {
  const cookieStore = await cookies()
  const cookieName = "authjs.session-token"
  const token = cookieStore.get(cookieName)?.value
  if (!token) return null
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? ""
  try {
    const payload = await decode({ token, secret, salt: cookieName })
    return payload
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const session = await getSession()

  if (!session?.sub) {
    redirect("/login")
  }

  const userId = session.sub as string

  const stats = await getDashboardStats(userId)
  const activities = await getRecentActivity(userId, 6)
  const teamStats = await getTeamStats(userId)

  const serializedActivities = activities.map((a) => ({
    ...a,
    date: a.date.toISOString(),
  }))

  const monthPercentages = calculateTimePercentages(teamStats.month)

  return (
    <DashboardClient
      stats={stats}
      activities={serializedActivities}
      teamStats={teamStats}
      monthPercentages={monthPercentages}
    />
  )
}
