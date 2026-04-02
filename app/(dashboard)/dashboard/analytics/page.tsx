"use client";

import { useState } from "react";
import Link from "next/link";
import ChartLine from "@/components/dashboard/ChartLine";
import AdminCard from "@/components/dashboard/AdminCard";

type SourceRow = {
  source: string;
  leads: number;
  conversion: string;
  revenue: string;
  trend: "up" | "flat";
};

const sourceRows: SourceRow[] = [
  { source: "Inbound website", leads: 48, conversion: "32%", revenue: "24.800 $", trend: "up" },
  { source: "Referral clients", leads: 31, conversion: "41%", revenue: "19.600 $", trend: "up" },
  { source: "LinkedIn outreach", leads: 27, conversion: "22%", revenue: "9.400 $", trend: "flat" },
  { source: "Partenariats", leads: 16, conversion: "37%", revenue: "12.200 $", trend: "up" },
  { source: "Email campaign", leads: 22, conversion: "18%", revenue: "6.500 $", trend: "flat" },
];

const teamPerformance = [
  { id: "design", label: "Design", value: 88, color: "#1D4ED8" },
  { id: "frontend", label: "Frontend", value: 82, color: "#2563EB" },
  { id: "backend", label: "Backend", value: 76, color: "#3B82F6" },
  { id: "marketing", label: "Marketing", value: 69, color: "#60A5FA" },
  { id: "support", label: "Support", value: 72, color: "#93C5FD" },
];

const sprintObjectives = [
  { id: "1", label: "Finaliser 2 livraisons client", done: true },
  { id: "2", label: "Augmenter le taux de conversion a 30%", done: true },
  { id: "3", label: "Descendre le delai de reponse < 2h", done: false },
  { id: "4", label: "Valider 5 nouveaux leads qualifies", done: false },
];

const kpiCards = [
  {
    id: "leads",
    title: "Leads entrants",
    subtitle: "vs periode precedente",
    value: "+18",
  },
  {
    id: "mql",
    title: "MQL qualifies",
    subtitle: "filtrage commercial",
    value: "64",
  },
  {
    id: "reply",
    title: "Taux de reponse",
    subtitle: "messages < 2h",
    value: "91%",
  },
  {
    id: "cycle",
    title: "Cycle moyen",
    subtitle: "du lead au deal",
    value: "11 jours",
  },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState("30");

  function handleExportCsv() {
    const rows = [
      ["source", "leads", "conversion", "revenue", "trend"],
      ...sourceRows.map((row) => [row.source, String(row.leads), row.conversion, row.revenue, row.trend]),
    ];

    const csv = rows.map((r) => r.map((v) => `"${v.replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-overview-${range}j.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5" style={{ animation: "reveal-up 0.7s ease-out both" }}>
      <div className="rounded-[28px] border border-blue-100 bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,#eff6ff_30%,#f8fbff_85%)] p-4 sm:p-5 lg:p-6">
        <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <AdminCard padding="lg" className="rounded-3xl border-blue-100 bg-white/95">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700/80">Analytics center</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">Performance business et production</h2>
                <p className="mt-1.5 text-sm text-slate-500">Vue consolidee des leads, de la conversion et de la charge equipe.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                >
                  <option value="7">7 jours</option>
                  <option value="30">30 jours</option>
                  <option value="90">90 jours</option>
                </select>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] transition hover:brightness-105"
                >
                  Export CSV
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Leads qualifies</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">144</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Conversion</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">29.4%</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Revenue signe</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">72.500 $</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link
                href="/dashboard/projects"
                className="inline-flex items-center rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
              >
                Voir les projets
              </Link>
              <Link
                href="/dashboard/messages"
                className="inline-flex items-center rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
              >
                Ouvrir messages
              </Link>
            </div>
          </AdminCard>

          <div className="rounded-3xl border border-blue-200 bg-[linear-gradient(145deg,#0f3dbe_0%,#1550d7_45%,#2b6ff0_100%)] p-6 text-white shadow-[0_16px_36px_rgba(37,99,235,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-100">Funnel snapshot</p>
            <h3 className="mt-2 text-xl font-semibold leading-tight">Taux de closing en progression</h3>
            <p className="mt-2 text-sm leading-6 text-blue-100/90">+6.2 points depuis le dernier cycle sur les leads inbound et referral.</p>

            <div className="mt-6 flex items-center justify-center">
              <div className="relative h-40 w-40 rounded-full bg-[conic-gradient(#dbeafe_0deg_105deg,#93c5fd_105deg_215deg,#60a5fa_215deg_290deg,#1d4ed8_290deg_360deg)] p-4">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-blue-700">
                  <p className="text-[11px] text-blue-100">Close rate</p>
                  <p className="mt-1 text-3xl font-semibold">29%</p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-blue-100/90">Objectif trimestre: 33%</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" style={{ animation: "reveal-up 0.7s ease-out both", animationDelay: "130ms" }}>
        {kpiCards.map((kpi) => (
          <AdminCard key={kpi.id} padding="md" className="rounded-2xl border-blue-100 bg-white">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{kpi.title}</p>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">KPI</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{kpi.subtitle}</p>
            <p className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">{kpi.value}</p>
          </AdminCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]" style={{ animation: "reveal-up 0.7s ease-out both", animationDelay: "240ms" }}>
        <AdminCard padding="md" className="rounded-3xl border-blue-100 bg-white">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Pipeline evolution (30 jours)</h3>
              <p className="mt-1 text-xs text-slate-500">Projection des opportunites et deals clotures</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tracking-tight text-slate-900">72.500 $</p>
              <p className="text-xs font-semibold text-blue-700">+18.4% ce mois</p>
            </div>
          </div>
          <ChartLine />
        </AdminCard>

        <AdminCard padding="md" className="rounded-3xl border-blue-100 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Performance equipe</h3>
            <span className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">Capacite sprint</span>
          </div>

          <div className="mt-4 space-y-2.5">
            {teamPerformance.map((team) => (
              <div key={team.id}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">{team.label}</span>
                  <span className="font-semibold text-slate-900">{team.value}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-blue-50">
                  <div className="h-full rounded-full" style={{ width: `${team.value}%`, background: team.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
            <p className="text-xs font-medium text-slate-600">Disponibilite moyenne equipe</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">76%</p>
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]" style={{ animation: "reveal-up 0.7s ease-out both", animationDelay: "350ms" }}>
        <AdminCard padding="none" className="overflow-hidden rounded-3xl border-blue-100 bg-white">
          <div className="flex items-center justify-between border-b border-blue-50 px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Acquisition sources</h3>
              <p className="mt-1 text-xs text-slate-500">Canaux les plus rentables sur la periode</p>
            </div>
            <span className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">{range} jours</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-blue-100 bg-slate-50/50">
                  {["Source", "Leads", "Conversion", "Revenue"].map((head) => (
                    <th
                      key={head}
                      className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sourceRows.map((row) => (
                  <tr key={row.source} className="border-b border-blue-50 last:border-b-0 transition hover:bg-blue-50/40">
                    <td className="px-5 py-4 text-sm font-medium text-slate-800">{row.source}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{row.leads}</td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{
                          background: row.trend === "up" ? "#DBEAFE" : "#E2E8F0",
                          color: row.trend === "up" ? "#1D4ED8" : "#475569",
                        }}
                      >
                        {row.conversion}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-blue-700">{row.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>

        <AdminCard padding="lg" className="rounded-3xl border-blue-100 bg-white">
          <h3 className="text-base font-semibold text-slate-900">Objectifs sprint</h3>
          <p className="mt-1 text-xs text-slate-500">Suivi execution equipe commercial et delivery</p>

          <div className="mt-5 space-y-3">
            {sprintObjectives.map((objective) => (
              <div key={objective.id} className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2.5">
                <span
                  className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    background: objective.done ? "#1D4ED8" : "#BFDBFE",
                    color: objective.done ? "#FFFFFF" : "#1E40AF",
                  }}
                >
                  {objective.done ? "✓" : "•"}
                </span>
                <span className="text-sm text-slate-700">{objective.label}</span>
              </div>
            ))}
          </div>

          <Link
            href="/dashboard/projects"
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Voir planning projet
          </Link>
        </AdminCard>
      </div>
    </div>
  );
}
