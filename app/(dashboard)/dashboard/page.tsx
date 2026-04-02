import { auth } from "@/lib/auth"
import {
  getDashboardStats,
  getRecentActivity,
  formatActivityDate,
  getTeamStats,
  calculateTimePercentages,
} from "@/lib/dashboard-stats"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const stats = await getDashboardStats(session.user.id)
  const activities = await getRecentActivity(session.user.id, 6)
  const teamStats = await getTeamStats(session.user.id)

  // Serialiser les dates pour le client
  const serializedActivities = activities.map((a) => ({
    ...a,
    date: a.date.toISOString(),
  }))

  // Calculer les pourcentages pour le mois (affichage principal)
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
