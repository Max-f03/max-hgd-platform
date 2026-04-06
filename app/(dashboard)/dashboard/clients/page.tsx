"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ClientForm, { type ClientData } from "@/components/dashboard/ClientForm";

const avatarColors = [
  { bg: "#DBEAFE", text: "#1D4ED8" },
  { bg: "#EFF6FF", text: "#2563EB" },
  { bg: "#DBEAFE", text: "#1D4ED8" },
  { bg: "#FEF3C7", text: "#B45309" },
  { bg: "#FCE7F3", text: "#BE185D" },
  { bg: "#CFFAFE", text: "#0891B2" },
];

type ClientStatus = "lead" | "active" | "completed";
type ViewMode = "table" | "cards";
type SortMode = "name" | "projects" | "recent";

interface Client {
  id: string;
  initials?: string;
  name: string;
  email: string;
  company: string;
  status: ClientStatus;
  projects: number;
  phone?: string;
  notes?: string;
}

const initialClients: Client[] = [];

const statusConfig = {
  lead:      { label: "Lead",     bg: "#DBEAFE", color: "#1D4ED8" },
  active:    { label: "Actif",    bg: "#DBEAFE", color: "#1D4ED8" },
  completed: { label: "Complete", bg: "#F1F5F9", color: "#475569" },
};

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Chargement...</div>}>
      <ClientsContent />
    </Suspense>
  );
}

function ClientsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState(initialClients);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ClientStatus>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(() => searchParams.get("create") === "1");
  const [lastCreatedClient, setLastCreatedClient] = useState<Client | null>(null);

  useEffect(() => {
    async function loadClients() {
      try {
        const response = await fetch("/api/clients?includeAll=1", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { clients?: Client[] };
        if (data.clients) {
          const normalized = data.clients.map((client) => ({
            ...client,
            initials:
              client.initials ??
              (
                client.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() ?? "")
                  .join("") || "CL"
              ),
            status: (client.status ?? "lead") as ClientStatus,
            projects: Number.isFinite(client.projects) ? client.projects : 0,
          }));
          setClients(normalized);
          setSelectedClientId((prev) => prev || normalized[0]?.id || "");
        }
      } catch {
        // Keep local fallback data when API is unreachable.
      }
    }
    void loadClients();
  }, []);

  useEffect(() => {
    if (!isCreatePanelOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsCreatePanelOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isCreatePanelOpen]);

  async function handleDeleteClient(clientId: string, clientName: string) {
    const ok = window.confirm(`Supprimer le client \"${clientName}\" ?`);
    if (!ok) return;
    const response = await fetch(`/api/clients?id=${clientId}`, { method: "DELETE" });
    if (!response.ok) {
      window.alert("La suppression du client a echoue.");
      return;
    }
    setClients((prev) => prev.filter((c) => c.id !== clientId));
  }

  async function handleCreateClient(data: ClientData) {
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        company: data.company,
        status: data.status,
      }),
    });

    if (!response.ok) {
      window.alert("La creation du client a echoue.");
      return;
    }

    const payload = (await response.json()) as { client?: Client };
    if (payload.client) {
      const client = payload.client;
      const normalizedClient: Client = {
        ...client,
        initials:
          client.initials ??
          (
            client.name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? "")
              .join("") || "CL"
          ),
        projects: Number.isFinite(client.projects) ? client.projects : 0,
        status: (client.status ?? "lead") as ClientStatus,
      };

      setClients((prev) => [normalizedClient, ...prev]);
      setSelectedClientId(normalizedClient.id);
      setIsCreatePanelOpen(false);
      setLastCreatedClient(normalizedClient);
    }
  }

  const filteredClients = useMemo(() => {
    const base = clients.filter((client) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        client.name.toLowerCase().includes(q) ||
        client.email.toLowerCase().includes(q) ||
        client.company.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return [...base].sort((a, b) => {
      if (sortMode === "projects") return b.projects - a.projects || a.name.localeCompare(b.name, "fr");
      if (sortMode === "recent") return Number(b.id) - Number(a.id);
      return a.name.localeCompare(b.name, "fr");
    });
  }, [clients, search, statusFilter, sortMode]);

  const activeCount = clients.filter((client) => client.status === "active").length;
  const leadCount = clients.filter((client) => client.status === "lead").length;
  const completedCount = clients.filter((client) => client.status === "completed").length;

  const selectedClient = filteredClients.find((client) => client.id === selectedClientId) ?? filteredClients[0] ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[26px] border border-blue-100 bg-blue-50 p-4 sm:p-5 lg:p-6" style={{ animation: "fadeSlideUp 320ms ease-out both" }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Client management</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Base clients</h1>
            <p className="mt-1 text-sm text-slate-600">{clients.length} clients suivis actuellement</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreatePanelOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nouveau client
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" style={{ animation: "fadeSlideUp 420ms ease-out both" }}>
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">Total</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">{clients.length}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">Actifs</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">Leads</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">{leadCount}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">Completes</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">{completedCount}</p>
          </div>
        </div>

        {lastCreatedClient ? (
          <div className="mt-3 rounded-xl border border-blue-200 bg-white px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-700">
                Client cree: <span className="font-semibold text-slate-900">{lastCreatedClient.name}</span>
              </p>
              <button
                type="button"
                onClick={() => router.push(`/dashboard/projects/new?clientId=${lastCreatedClient.id}`)}
                className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Creer un projet pour ce client
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]" style={{ animation: "fadeSlideUp 520ms ease-out both" }}>
        <div className="min-w-0 rounded-3xl border border-blue-100 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              aria-label="Rechercher un client"
              placeholder="Rechercher un client..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 min-w-[180px] flex-1 rounded-xl border border-blue-100 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
            />

            <select
              aria-label="Filtrer les clients par statut"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | ClientStatus)}
              className="h-10 rounded-xl border border-blue-100 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
            >
              <option value="all">Tous statuts</option>
              <option value="active">Actifs</option>
              <option value="lead">Leads</option>
              <option value="completed">Completes</option>
            </select>

            <select
              aria-label="Trier les clients"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="h-10 rounded-xl border border-blue-100 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
            >
              <option value="name">Tri: nom</option>
              <option value="projects">Tri: projets</option>
              <option value="recent">Tri: recents</option>
            </select>

            <div className="inline-flex items-center rounded-xl border border-blue-100 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={[
                  "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition",
                  viewMode === "table" ? "bg-blue-600 text-white" : "text-blue-700 hover:bg-blue-50",
                ].join(" ")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <line x1="8" y1="4" x2="8" y2="20" />
                  <line x1="14" y1="10" x2="14" y2="20" />
                </svg>
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={[
                  "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition",
                  viewMode === "cards" ? "bg-blue-600 text-white" : "text-blue-700 hover:bg-blue-50",
                ].join(" ")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="8" height="8" rx="1" />
                  <rect x="13" y="3" width="8" height="8" rx="1" />
                  <rect x="3" y="13" width="8" height="8" rx="1" />
                  <rect x="13" y="13" width="8" height="8" rx="1" />
                </svg>
                Cartes
              </button>
            </div>
          </div>

          {filteredClients.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/40 px-4 py-10 text-center">
              <p className="text-sm font-medium text-slate-500">Aucun client trouve avec ces filtres.</p>
            </div>
          ) : viewMode === "table" ? (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-blue-100">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[200px]" />
                  <col className="w-[220px]" />
                  <col className="w-[130px]" />
                  <col className="w-[90px]" />
                  <col className="w-[80px]" />
                  <col className="w-[130px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-blue-100 bg-blue-50/40">
                    {["Client", "Email", "Entreprise", "Statut", "Projets", ""].map((header) => (
                      <th key={header} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client, index) => {
                    const status = statusConfig[client.status];
                    const colors = avatarColors[index % avatarColors.length];
                    const selected = selectedClient?.id === client.id;

                    return (
                      <tr
                        key={client.id}
                        onClick={() => setSelectedClientId(client.id)}
                        className={["cursor-pointer border-b border-blue-50 transition-all duration-200 last:border-b-0", selected ? "bg-blue-50/60" : "hover:bg-blue-50/35"].join(" ")}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: colors.bg, color: colors.text }}>
                              {client.initials}
                            </div>
                            <span className="truncate text-sm font-semibold text-slate-900" title={client.name}>{client.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-600"><span className="block truncate" title={client.email}>{client.email}</span></td>
                        <td className="px-4 py-3.5 text-sm text-slate-600"><span className="block truncate" title={client.company}>{client.company}</span></td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: status.bg, color: status.color }}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{client.projects}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/dashboard/clients/${client.id}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-blue-100 hover:text-blue-700" aria-label="Voir">
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            </Link>
                            <Link href={`/dashboard/clients/${client.id}/edit`} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-blue-100 hover:text-blue-700" aria-label="Modifier">
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </Link>
                            <button type="button" onClick={(event) => { event.stopPropagation(); void handleDeleteClient(client.id, client.name); }} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" aria-label="Supprimer">
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredClients.map((client, index) => {
                const colors = avatarColors[index % avatarColors.length];
                const status = statusConfig[client.status];
                const selected = selectedClient?.id === client.id;

                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setSelectedClientId(client.id)}
                    className="rounded-2xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                    style={{ borderColor: selected ? "#2563EB" : "#DBEAFE", background: selected ? "#EFF6FF" : "#FFFFFF" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold" style={{ background: colors.bg, color: colors.text }}>
                          {client.initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{client.name}</p>
                          <p className="text-xs text-slate-500">{client.company}</p>
                        </div>
                      </div>
                      <span className="inline-flex rounded-full px-2 py-1 text-[10px] font-semibold" style={{ background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </div>

                    <p className="mt-3 truncate text-sm text-slate-600">{client.email}</p>
                    <p className="mt-1 text-xs text-slate-500">{client.projects} projet(s)</p>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-4 border-t border-blue-100 pt-3 text-xs text-slate-500">
            {filteredClients.length} client(s) affiche(s)
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-4 sm:p-5 xl:sticky xl:top-20 xl:h-fit">
          {selectedClient ? (
            <div key={selectedClient.id} style={{ animation: "panelIn 240ms ease-out both" }}>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-700">Client selectionne</p>
                <h3 className="mt-1 break-words text-lg font-semibold tracking-tight text-slate-900">{selectedClient.name}</h3>
                <p className="mt-1 text-xs text-slate-600">{selectedClient.company}</p>
              </div>

              <div className="mt-4 space-y-3 rounded-2xl border border-blue-50 bg-white p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium text-slate-900">{selectedClient.email}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Telephone</span>
                  <span className="font-medium text-slate-900">{selectedClient.phone ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Statut</span>
                  <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: statusConfig[selectedClient.status].bg, color: statusConfig[selectedClient.status].color }}>
                    {statusConfig[selectedClient.status].label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Projets</span>
                  <span className="font-medium text-slate-900">{selectedClient.projects}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/projects/new?clientId=${selectedClient.id}`)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700"
                  title="Nouveau projet"
                  aria-label="Nouveau projet"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <Link href={`/dashboard/clients/${selectedClient.id}`} className="inline-flex h-11 w-20 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700" title="Voir" aria-label="Voir le client">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </Link>
                <Link href={`/dashboard/clients/${selectedClient.id}/edit`} className="inline-flex h-11 w-20 items-center justify-center rounded-xl border border-blue-300 bg-white text-blue-700 transition hover:bg-blue-50" title="Modifier" aria-label="Modifier le client">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    void handleDeleteClient(selectedClient.id, selectedClient.name);
                  }}
                  className="inline-flex h-11 w-20 items-center justify-center rounded-xl border border-red-300 bg-white text-red-600 transition hover:bg-red-50"
                  title="Supprimer" aria-label="Supprimer le client"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 px-4 py-10 text-center">
              <p className="text-sm font-medium text-slate-500">Selectionnez un client pour voir ses details.</p>
            </div>
          )}
        </div>
      </div>

      <div
        className={[
          "fixed inset-0 z-50 transition-opacity duration-300",
          isCreatePanelOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        aria-hidden={!isCreatePanelOpen}
      >
        <button
          type="button"
          aria-label="Fermer le panneau"
          className="absolute inset-0 bg-slate-900/35 transition-opacity duration-300"
          onClick={() => setIsCreatePanelOpen(false)}
        />

        <aside
          className={[
            "absolute right-0 top-0 h-full w-full max-w-sm bg-white border-l border-slate-200 shadow-2xl",
            "transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isCreatePanelOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
          aria-label="Creation client"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#1D4ED8" }}>Creation</p>
              <h3 className="text-base font-semibold" style={{ color: "#0F172A" }}>Nouveau client</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsCreatePanelOpen(false)}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-colors hover:bg-slate-100"
              style={{ color: "#64748B" }}
              aria-label="Fermer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="h-[calc(100%-73px)] overflow-y-auto px-6 py-5">
            <ClientForm
              onSubmit={handleCreateClient}
              onCancel={() => setIsCreatePanelOpen(false)}
            />
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes panelIn {
          from {
            opacity: 0;
            transform: translateX(8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
