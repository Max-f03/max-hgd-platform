import prisma from "@/lib/prisma"

export async function getDashboardStats(userId: string) {
  // Projets actifs (draft, published)
  const activeProjects = await prisma.project.count({
    where: {
      userId,
      status: { in: ["draft", "published"] },
    },
  })

  // Clients actifs
  const activeClients = await prisma.client.count({
    where: {
      userId,
      status: "active",
    },
  })

  // Total clients
  const totalClients = await prisma.client.count({
    where: { userId },
  })

  // Messages non lus
  const unreadMessages = await prisma.message.count({
    where: {
      userId,
      status: "unread",
      direction: "received",
    },
  })

  // CA mensuel (factures payees ce mois)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const monthlyRevenue = await prisma.invoice.aggregate({
    where: {
      userId,
      status: "paid",
      paidAt: { gte: startOfMonth },
    },
    _sum: { totalTTC: true },
  })

  // Sante globale (calcul simple)
  const healthScore = calculateHealthScore({
    activeProjects,
    activeClients,
    unreadMessages,
  })

  // Livrables en attente de validation client via Kanban (fallback: projets draft)
  const projectTaskDelegate = (
    prisma as unknown as {
      projectTask?: {
        count: (args: {
          where: { userId: string; type: string; status: string }
        }) => Promise<number>
      }
    }
  ).projectTask

  const pendingDeliverables = projectTaskDelegate
    ? await projectTaskDelegate.count({
        where: {
          userId,
          type: "deliverable",
          status: "review",
        },
      })
    : await prisma.project.count({
        where: {
          userId,
          status: "draft",
        },
      })

  return {
    activeProjects,
    activeClients,
    totalClients,
    unreadMessages,
    monthlyRevenue: monthlyRevenue._sum.totalTTC || 0,
    healthScore,
    pendingDeliverables,
  }
}

function calculateHealthScore(data: {
  activeProjects: number
  activeClients: number
  unreadMessages: number
}): number {
  let score = 100

  // Penalite si trop de messages non lus
  if (data.unreadMessages > 10) score -= 20
  else if (data.unreadMessages > 5) score -= 10
  else if (data.unreadMessages > 0) score -= 5

  // Bonus si projets actifs
  if (data.activeProjects >= 5) score += 5

  // Bonus si clients actifs
  if (data.activeClients >= 3) score += 5

  return Math.min(100, Math.max(0, score))
}

export interface Activity {
  date: Date
  label: string
  type: string
  value: string
  valueColor: "blue" | "gray"
}

export async function getRecentActivity(
  userId: string,
  limit: number = 6
): Promise<Activity[]> {
  const projectTaskTransitionDelegate = (
    prisma as unknown as {
      projectTaskTransition?: {
        findMany: (args: {
          where: { movedByUserId: string }
          orderBy: { movedAt: "desc" }
          take: number
          include: { task: true }
        }) => Promise<
          Array<{
            movedAt: Date
            fromStageKey: string | null
            toStageKey: string
            task: { title: string }
          }>
        >
      }
    }
  ).projectTaskTransition

  // Recuperer les activites recentes de plusieurs sources
  const [recentMessages, recentClients, recentProjects, recentTaskMoves] =
    await Promise.all([
    // Messages recents
    prisma.message.findMany({
      where: { userId, direction: "received" },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { client: true },
    }),

    // Nouveaux clients
    prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),

    // Projets recents
    prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),

    projectTaskTransitionDelegate
      ? projectTaskTransitionDelegate.findMany({
          where: { movedByUserId: userId },
          orderBy: { movedAt: "desc" },
          take: 3,
          include: { task: true },
        })
      : Promise.resolve([]),
  ])

  // Combiner et trier par date
  const activities: Activity[] = []

  for (const msg of recentMessages) {
    activities.push({
      date: msg.createdAt,
      label:
        msg.status === "unread"
          ? "Message client prioritaire"
          : "Message client",
      type: "Communication",
      value: msg.status === "unread" ? "Unread" : "Read",
      valueColor: msg.status === "unread" ? "gray" : "blue",
    })
  }

  for (const client of recentClients) {
    activities.push({
      date: client.createdAt,
      label: "Nouveau lead entrant",
      type: "Client",
      value: "+1",
      valueColor: "blue",
    })
  }

  for (const project of recentProjects) {
    activities.push({
      date: project.updatedAt,
      label:
        project.status === "published"
          ? "Projet publie"
          : "Mise a jour projet",
      type: "Projet",
      value: project.status === "published" ? "Done" : "WIP",
      valueColor: "blue",
    })
  }

  for (const move of recentTaskMoves) {
    activities.push({
      date: move.movedAt,
      label:
        move.toStageKey === "done"
          ? `Etape terminee: ${move.task.title}`
          : `Pipeline mise a jour: ${move.task.title}`,
      type: "Pipeline",
      value: move.toStageKey === "done" ? "Done" : "WIP",
      valueColor: "blue",
    })
  }

  // Trier par date decroissante et limiter
  return activities
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit)
}

export function formatActivityDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return "Aujourd'hui"
  if (days === 1) return "Hier"

  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
}

// ==================== TIME TRACKING ====================

export interface TimeDistribution {
  design: number
  dev: number
  meeting: number
  support: number
  admin: number
  total: number
}

function getPeriodStartDate(period: "week" | "sprint" | "month"): Date {
  const now = new Date()

  switch (period) {
    case "week": {
      // Start of current week (Monday)
      const date = new Date(now)
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? -6 : 1)
      return new Date(date.setDate(diff))
    }

    case "sprint": {
      // Last 14 days
      const date = new Date(now)
      date.setDate(date.getDate() - 14)
      return date
    }

    case "month": {
      // Start of current month
      return new Date(now.getFullYear(), now.getMonth(), 1)
    }
  }
}

export async function getTimeDistribution(
  userId: string,
  period: "week" | "sprint" | "month" = "month"
): Promise<TimeDistribution> {
  const startDate = getPeriodStartDate(period)

  const emptyDistribution: TimeDistribution = {
    design: 0,
    dev: 0,
    meeting: 0,
    support: 0,
    admin: 0,
    total: 0,
  }

  const timeEntryDelegate = (
    prisma as unknown as {
      timeEntry?: {
        findMany: (args: {
          where: { userId: string; date: { gte: Date } }
        }) => Promise<Array<{ activityType: string; hours: number }>>
      }
    }
  ).timeEntry

  if (!timeEntryDelegate) {
    return emptyDistribution
  }

  const timeEntries = await timeEntryDelegate.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
  })

  // Group by activity type and sum hours
  const distribution: TimeDistribution = { ...emptyDistribution }

  for (const entry of timeEntries) {
    const type = entry.activityType as
      | "design"
      | "dev"
      | "meeting"
      | "support"
      | "admin"

    if (type in distribution) {
      distribution[type] += entry.hours
    }

    distribution.total += entry.hours
  }

  return distribution
}

export async function getTeamStats(
  userId: string
): Promise<{
  week: TimeDistribution
  sprint: TimeDistribution
  month: TimeDistribution
}> {
  const [week, sprint, month] = await Promise.all([
    getTimeDistribution(userId, "week"),
    getTimeDistribution(userId, "sprint"),
    getTimeDistribution(userId, "month"),
  ])

  return { week, sprint, month }
}

export function calculateTimePercentages(
  distribution: TimeDistribution
): Record<string, number> {
  if (distribution.total === 0) {
    return {
      design: 0,
      dev: 0,
      meeting: 0,
      support: 0,
      admin: 0,
    }
  }

  return {
    design: Math.round((distribution.design / distribution.total) * 100),
    dev: Math.round((distribution.dev / distribution.total) * 100),
    meeting: Math.round((distribution.meeting / distribution.total) * 100),
    support: Math.round((distribution.support / distribution.total) * 100),
    admin: Math.round((distribution.admin / distribution.total) * 100),
  }
}
