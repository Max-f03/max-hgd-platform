"use client"

import Link from "next/link"
import AdminCard from "@/components/dashboard/AdminCard"
import { formatCurrency, formatDate } from "@/lib/format"

interface Activity {
  date: string
  label: string
  type: string
  value: string
  valueColor: "blue" | "gray"
}

interface DashboardClientProps {
  stats: {
    activeProjects: number
    activeClients: number
    totalClients: number
    unreadMessages: number
    monthlyRevenue: number
    healthScore: number
    pendingDeliverables: number
  }
  activities: Activity[]
  teamStats: {
    week: {
      design: number
      dev: number
      meeting: number
      support: number
      admin: number
      total: number
    }
    sprint: {
      design: number
      dev: number
      meeting: number
      support: number
      admin: number
      total: number
    }
    month: {
      design: number
      dev: number
      meeting: number
      support: number
      admin: number
      total: number
    }
  }
  monthPercentages: Record<string, number>
}

function buildDonutGradient(percentages: Record<string, number>): string {
  const order = ["design", "dev", "meeting", "support", "admin"]
  const colors = ["#1D4ED8", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD"]

  let gradient = "conic-gradient("
  let currentDegree = 0

  for (let i = 0; i < order.length; i++) {
    const key = order[i]
    const percentage = percentages[key] || 0
    const degrees = (percentage / 100) * 360

    const startDeg = currentDegree
    const endDeg = currentDegree + degrees

    gradient += `${colors[i]} ${Math.round(startDeg)}deg ${Math.round(endDeg)}deg`

    if (i < order.length - 1) gradient += ","

    currentDegree = endDeg
  }

  gradient += ")"
  return gradient
}

export default function DashboardClient({
  stats,
  activities,
  teamStats,
  monthPercentages,
}: DashboardClientProps) {
  const banks = [
    {
      id: "1",
      name: "Projets actifs",
      iban: "En cours",
      amount: stats.activeProjects.toString(),
    },
    {
      id: "2",
      name: "Clients actifs",
      iban: `${stats.totalClients} comptes suivis`,
      amount: stats.activeClients.toString(),
    },
    {
      id: "3",
      name: "Messages non lus",
      iban: "Boite reception",
      amount: stats.unreadMessages.toString(),
    },
    {
      id: "4",
      name: "CA mensuel",
      iban: "Mois en cours",
      amount: formatCurrency(stats.monthlyRevenue),
    },
  ]

  // Build donut gradient dynamically
  const donutGradient = buildDonutGradient(monthPercentages)

  // Build legend with real percentages
  const expenseLegend = [
    {
      id: "design",
      label: "Design",
      value: `${monthPercentages.design}%`,
      color: "#1D4ED8",
    },
    {
      id: "dev",
      label: "Development",
      value: `${monthPercentages.dev}%`,
      color: "#2563EB",
    },
    {
      id: "client",
      label: "Client meetings",
      value: `${monthPercentages.meeting}%`,
      color: "#3B82F6",
    },
    {
      id: "support",
      label: "Support",
      value: `${monthPercentages.support}%`,
      color: "#60A5FA",
    },
    {
      id: "ops",
      label: "Admin ops",
      value: `${monthPercentages.admin}%`,
      color: "#93C5FD",
    },
  ]

  return (
    <div
      className="flex flex-col gap-5"
      style={{ animation: "reveal-up 0.7s ease-out both" }}
    >
      <div className="rounded-[28px] border border-blue-100 bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,#eff6ff_30%,#f8fbff_80%)] p-4 sm:p-5 lg:p-6">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <AdminCard padding="lg" className="rounded-3xl border-blue-100 bg-white/95">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700/80">
              Command center
            </p>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Max HGD Platform - Vue operationnelle
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Pilotage centralise des projets, clients et messages
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
                  Santé globale
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                  {stats.healthScore}/100
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/dashboard/projects/new"
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] transition hover:brightness-105"
              >
                Nouveau projet
              </Link>
              <Link
                href="/dashboard/clients"
                className="inline-flex items-center rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
              >
                Gerer les clients
              </Link>
            </div>
          </AdminCard>

          <div className="rounded-3xl border border-blue-200 bg-[linear-gradient(145deg,#0f3dbe_0%,#1550d7_45%,#2b6ff0_100%)] p-6 text-white shadow-[0_16px_36px_rgba(37,99,235,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-100">
                  Weekly insight
                </p>
                <h3 className="mt-2 text-xl font-semibold leading-tight">
                  {stats.pendingDeliverables} livraisons en attente de
                  validation
                </h3>
                <p className="mt-2 text-sm leading-6 text-blue-100/90">
                  Priorite: cloturer les retours clients et finaliser les
                  maquettes du sprint en cours.
                </p>
              </div>
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-white/90" />
            </div>

            <Link
              href="/dashboard/analytics"
              className="mt-6 inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
            >
              Ouvrir analytics
            </Link>
          </div>
        </div>
      </div>

      <div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        style={{
          animation: "reveal-up 0.7s ease-out both",
          animationDelay: "140ms",
        }}
      >
        {banks.map((bank) => (
          <AdminCard
            key={bank.id}
            padding="md"
            className="rounded-2xl border-blue-100 bg-white"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">
                {bank.name}
              </p>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                KPI
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{bank.iban}</p>
            <p className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
              {bank.amount}
            </p>
          </AdminCard>
        ))}
      </div>

      <div
        className="grid gap-4 xl:grid-cols-[1.35fr_1fr]"
        style={{
          animation: "reveal-up 0.7s ease-out both",
          animationDelay: "260ms",
        }}
      >
        <AdminCard
          padding="none"
          className="overflow-hidden rounded-3xl border-blue-100 bg-white"
        >
          <div className="flex items-center justify-between border-b border-blue-50 px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Activite recente
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Timeline operationnelle du workspace
              </p>
            </div>
            <Link
              href="/dashboard/messages"
              className="text-xs font-semibold text-blue-700 transition hover:text-blue-800"
            >
              Voir plus
            </Link>
          </div>

          {activities.map((item, index) => (
            <div
              key={index}
              className={[
                "grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 sm:px-6",
                index < activities.length - 1 ? "border-b border-blue-50" : "",
              ].join(" ")}
            >
              <span className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                {formatDate(item.date)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{item.type}</p>
              </div>
              <p
                className={[
                  "text-sm font-semibold",
                  item.valueColor === "blue"
                    ? "text-blue-700"
                    : "text-slate-800",
                ].join(" ")}
              >
                {item.value}
              </p>
            </div>
          ))}
        </AdminCard>

        <AdminCard
          padding="lg"
          className="rounded-3xl border-blue-100 bg-white"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              Repartition charge equipe
            </h3>
            <Link
              href="/dashboard/analytics"
              className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Vue detail
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl bg-blue-50 px-3 py-2">
              <p className="text-slate-500">Semaine</p>
              <p className="mt-1 font-semibold text-slate-900">
                {Math.round(teamStats.week.total)} h
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 px-3 py-2">
              <p className="text-slate-500">Sprint</p>
              <p className="mt-1 font-semibold text-slate-900">
                {Math.round(teamStats.sprint.total)} h
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 px-3 py-2">
              <p className="text-slate-500">Mois</p>
              <p className="mt-1 font-semibold text-slate-900">
                {Math.round(teamStats.month.total)} h
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div
              className="relative h-48 w-48 rounded-full p-5"
              style={{ background: donutGradient }}
            >
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
                <p className="text-xs font-medium text-slate-500">Cycle actuel</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                  {Math.round(teamStats.month.total)} h
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            {expenseLegend.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: item.color }}
                  />
                  <span className="text-slate-600">{item.label}</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
