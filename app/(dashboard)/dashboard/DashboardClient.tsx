"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import AdminCard from "@/components/dashboard/AdminCard"
import { formatCurrency, formatDate } from "@/lib/format"

interface Activity {
  date: string; label: string; type: string; value: string; valueColor: "blue" | "gray"
}
interface DashboardClientProps {
  stats: { activeProjects: number; activeClients: number; totalClients: number; unreadMessages: number; monthlyRevenue: number; healthScore: number; pendingDeliverables: number }
  activities: Activity[]
  teamStats: {
    week: { design: number; dev: number; meeting: number; support: number; admin: number; total: number }
    sprint: { design: number; dev: number; meeting: number; support: number; admin: number; total: number }
    month: { design: number; dev: number; meeting: number; support: number; admin: number; total: number }
  }
  monthPercentages: Record<string, number>
}

type KpiItem = { id: string; label: string; sub: string; value: string }
const KPI_LAYOUT_KEY = "dashboard-kpi-layout-v1"

function buildDonutGradient(p: Record<string, number>) {
  const order = ["design", "dev", "meeting", "support", "admin"]
  const colors = ["var(--d-chart-1)", "var(--d-chart-2)", "var(--d-chart-3)", "var(--d-chart-4)", "var(--d-chart-5)"]
  let g = "conic-gradient(", deg = 0
  order.forEach((k, i) => {
    const end = deg + ((p[k] || 0) / 100) * 360
    g += `${colors[i]} ${Math.round(deg)}deg ${Math.round(end)}deg${i < order.length - 1 ? "," : ""}`
    deg = end
  })
  return g + ")"
}

export default function DashboardClient({ stats, activities, teamStats, monthPercentages }: DashboardClientProps) {
  const baseKpis: KpiItem[] = useMemo(
    () => [
      { id: "active-projects", label: "Projets actifs", sub: "En cours", value: stats.activeProjects.toString() },
      { id: "active-clients", label: "Clients actifs", sub: `${stats.totalClients} comptes`, value: stats.activeClients.toString() },
      { id: "unread-messages", label: "Messages non lus", sub: "Boite reception", value: stats.unreadMessages.toString() },
      { id: "monthly-revenue", label: "CA mensuel", sub: "Mois en cours", value: formatCurrency(stats.monthlyRevenue) },
    ],
    [stats.activeClients, stats.activeProjects, stats.monthlyRevenue, stats.totalClients, stats.unreadMessages]
  )
  const [kpiOrder, setKpiOrder] = useState<string[]>(baseKpis.map((kpi) => kpi.id))
  const [draggingKpiId, setDraggingKpiId] = useState<string | null>(null)
  const [kpiFeedback, setKpiFeedback] = useState("Glissez-deposez vos widgets KPI pour personnaliser le dashboard")

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KPI_LAYOUT_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as string[]
      if (!Array.isArray(parsed) || parsed.length === 0) return

      const allKnownIds = new Set(baseKpis.map((kpi) => kpi.id))
      const sanitized = parsed.filter((id) => allKnownIds.has(id))
      const missing = baseKpis.map((kpi) => kpi.id).filter((id) => !sanitized.includes(id))
      setKpiOrder([...sanitized, ...missing])
    } catch {
      // Keep default order when localStorage payload is invalid.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const kpis = useMemo(() => {
    const byId = new Map(baseKpis.map((kpi) => [kpi.id, kpi]))
    return kpiOrder.map((id) => byId.get(id)).filter(Boolean) as KpiItem[]
  }, [baseKpis, kpiOrder])

  function persistKpiOrder(nextOrder: string[]) {
    try {
      localStorage.setItem(KPI_LAYOUT_KEY, JSON.stringify(nextOrder))
      setKpiFeedback("Layout sauvegarde")
      window.setTimeout(() => {
        setKpiFeedback("Glissez-deposez vos widgets KPI pour personnaliser le dashboard")
      }, 1600)
    } catch {
      setKpiFeedback("Impossible de sauvegarder ce layout")
    }
  }

  function handleDropKpi(targetId: string) {
    if (!draggingKpiId || draggingKpiId === targetId) {
      setDraggingKpiId(null)
      return
    }

    const dragIndex = kpiOrder.indexOf(draggingKpiId)
    const targetIndex = kpiOrder.indexOf(targetId)
    if (dragIndex < 0 || targetIndex < 0) {
      setDraggingKpiId(null)
      return
    }

    const next = [...kpiOrder]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(targetIndex, 0, moved)
    setKpiOrder(next)
    persistKpiOrder(next)
    setDraggingKpiId(null)
  }

  const donutGradient = buildDonutGradient(monthPercentages)
  const legend = [
    { label: "Design",          value: `${monthPercentages.design}%`,  color: "var(--d-chart-1)" },
    { label: "Development",     value: `${monthPercentages.dev}%`,     color: "var(--d-chart-2)" },
    { label: "Client meetings", value: `${monthPercentages.meeting}%`, color: "var(--d-chart-3)" },
    { label: "Support",         value: `${monthPercentages.support}%`, color: "var(--d-chart-4)" },
    { label: "Admin ops",       value: `${monthPercentages.admin}%`,   color: "var(--d-chart-5)" },
  ]

  return (
    <div className="flex flex-col gap-5" style={{ animation: "reveal-up 0.7s ease-out both" }}>

      {/* ── HERO ─*/}
      <div className="rounded-[28px] p-4 sm:p-5 lg:p-6" style={{ background: "var(--d-card)", border: "1px solid var(--d-border)", transition: "background 0.25s ease" }}>
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">

          {/* Command center */}
          <AdminCard padding="lg" style={{ borderRadius: "1.5rem" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ui-primary)" }}>
              Command center
            </p>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--d-t1)" }}>
                  Max HGD Platform — Vue opérationnelle
                </h2>
                <p className="mt-1 text-xs" style={{ color: "var(--d-t3)" }}>
                  Pilotage centralisé des projets, clients et messages
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--d-t3)" }}>
                  Santé globale
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-tight" style={{ color: "var(--d-t1)" }}>
                  {stats.healthScore}/100
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/dashboard/projects/new"
                className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                style={{ background: "linear-gradient(to right,var(--d-grad-primary-start),var(--d-grad-primary-end))", boxShadow: "0 8px 20px rgba(37,99,235,0.28)" }}
              >
                Nouveau projet
              </Link>
              <Link
                href="/dashboard/clients"
                className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition"
                style={{ border: "1px solid var(--d-border)", background: "var(--d-input)", color: "var(--d-t2)" }}
              >
                Gérer les clients
              </Link>
            </div>
          </AdminCard>

          {/* Weekly insight — bleu fixe, texte blanc */}
          <div className="rounded-3xl p-6 text-white" style={{ background: "linear-gradient(145deg,var(--d-grad-insight-start) 0%,var(--d-grad-insight-mid) 45%,var(--d-grad-insight-end) 100%)", boxShadow: "0 16px 36px rgba(37,99,235,0.3)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(219,234,254,0.9)" }}>
                  Weekly insight
                </p>
                <h3 className="mt-2 text-xl font-semibold leading-tight">
                  {stats.pendingDeliverables} livraisons en attente de validation
                </h3>
                <p className="mt-2 text-sm leading-6" style={{ color: "rgba(219,234,254,0.9)" }}>
                  Priorité : clôturer les retours clients et finaliser les maquettes du sprint en cours.
                </p>
              </div>
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-white/90" />
            </div>
            <Link href="/dashboard/analytics" className="mt-6 inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-50" style={{ background: "#FFFFFF" }}>
              Ouvrir analytics
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-1" style={{ animation: "reveal-up 0.7s ease-out both", animationDelay: "120ms" }}>
        <p className="text-xs" style={{ color: "var(--d-t3)" }}>{kpiFeedback}</p>
        <button
          type="button"
          onClick={() => {
            const resetOrder = baseKpis.map((kpi) => kpi.id)
            setKpiOrder(resetOrder)
            persistKpiOrder(resetOrder)
          }}
          className="rounded-lg px-2.5 py-1 text-xs font-semibold"
          style={{ background: "var(--d-input)", color: "var(--d-t2)", border: "1px solid var(--d-border)" }}
        >
          Reset layout
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" style={{ animation: "reveal-up 0.7s ease-out both", animationDelay: "140ms" }}>
        {kpis.map((k) => (
          <div
            key={k.id}
            draggable
            onDragStart={() => setDraggingKpiId(k.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDropKpi(k.id)}
            onDragEnd={() => setDraggingKpiId(null)}
            className="transition-transform duration-150"
            style={{ transform: draggingKpiId === k.id ? "scale(0.98)" : "none" }}
          >
            <AdminCard padding="md">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold" style={{ color: "var(--d-t1)" }}>{k.label}</p>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ui-primary)" }}>KPI</span>
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--d-t3)" }}>{k.sub}</p>
              <p className="mt-5 text-2xl font-semibold tracking-tight" style={{ color: "var(--d-t1)" }}>{k.value}</p>
            </AdminCard>
          </div>
        ))}
      </div>

      {/* ── ACTIVITÉ + DONUT ─────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]" style={{ animation: "reveal-up 0.7s ease-out both", animationDelay: "260ms" }}>

        {/* Activité récente */}
        <AdminCard padding="none" style={{ overflow: "hidden", borderRadius: "1.5rem" }}>
          <div className="flex items-center justify-between px-5 py-4 sm:px-6" style={{ borderBottom: "1px solid var(--d-border)" }}>
            <div>
              <h3 className="text-base font-semibold" style={{ color: "var(--d-t1)" }}>Activité récente</h3>
              <p className="mt-1 text-xs" style={{ color: "var(--d-t3)" }}>Timeline opérationnelle du workspace</p>
            </div>
            <Link href="/dashboard/messages" className="text-xs font-semibold transition" style={{ color: "#3B82F6" }}>
              Voir plus
            </Link>
          </div>
          {activities.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm" style={{ color: "var(--d-t3)" }}>Aucune activité récente</p>
          ) : activities.map((item, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 sm:px-6" style={{ borderBottom: i < activities.length - 1 ? "1px solid var(--d-border)" : "none" }}>
              <span className="rounded-lg px-2 py-1 text-[11px] font-semibold" style={{ background: "var(--d-badge-bg)", color: "var(--d-badge-c)" }}>
                {formatDate(item.date)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--d-t1)" }}>{item.label}</p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--d-t3)" }}>{item.type}</p>
              </div>
              <p className="text-sm font-semibold" style={{ color: item.valueColor === "blue" ? "var(--ui-primary)" : "var(--d-t2)" }}>
                {item.value}
              </p>
            </div>
          ))}
        </AdminCard>

        {/* Répartition charge */}
        <AdminCard padding="lg" style={{ borderRadius: "1.5rem" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold" style={{ color: "var(--d-t1)" }}>Répartition charge équipe</h3>
            <Link href="/dashboard/analytics" className="rounded-lg px-2 py-1 text-xs font-semibold text-white transition hover:brightness-110" style={{ background: "var(--ui-primary)" }}>
              Vue détail
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
            {[{ l: "Semaine", v: teamStats.week.total }, { l: "Sprint", v: teamStats.sprint.total }, { l: "Mois", v: teamStats.month.total }].map(s => (
              <div key={s.l} className="rounded-xl px-3 py-2" style={{ background: "var(--d-input)" }}>
                <p style={{ color: "var(--d-t3)" }}>{s.l}</p>
                <p className="mt-1 font-semibold" style={{ color: "var(--d-t1)" }}>{Math.round(s.v)} h</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center">
            <div className="relative h-48 w-48 rounded-full p-5" style={{ background: donutGradient }}>
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full" style={{ background: "var(--d-card)" }}>
                <p className="text-xs font-medium" style={{ color: "var(--d-t3)" }}>Cycle actuel</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight" style={{ color: "var(--d-t1)" }}>{Math.round(teamStats.month.total)} h</p>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-2.5">
            {legend.map(item => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                  <span style={{ color: "var(--d-t3)" }}>{item.label}</span>
                </div>
                <span className="font-semibold" style={{ color: "var(--d-t1)" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
