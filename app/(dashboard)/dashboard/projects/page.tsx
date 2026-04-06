"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProjectStatus = "published" | "draft" | "archived" | "completed";
type ViewMode = "grid" | "list";
type SortMode = "recent" | "title" | "status";

interface Project {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  status: ProjectStatus;
  date: string;
  featured: boolean;
}

const initialProjects: Project[] = [
  { id: "1", title: "Mobile Booking App", category: "ux-ui", categoryLabel: "UX/UI Design", status: "published", date: "15 Mar 2025", featured: true },
  { id: "2", title: "E-commerce Platform", category: "frontend", categoryLabel: "Frontend Dev", status: "published", date: "10 Mar 2025", featured: false },
  { id: "3", title: "Design System", category: "ux-ui", categoryLabel: "UX/UI Design", status: "draft", date: "5 Mar 2025", featured: false },
  { id: "4", title: "Dashboard Analytics", category: "frontend", categoryLabel: "Frontend Dev", status: "archived", date: "28 Fev 2025", featured: false },
  { id: "5", title: "Site Corporate", category: "ux-ui", categoryLabel: "UX/UI Design", status: "published", date: "20 Fev 2025", featured: true },
  { id: "6", title: "Identite Visuelle Startup", category: "branding", categoryLabel: "Branding", status: "published", date: "10 Fev 2025", featured: false },
];

const statusConfig: Record<ProjectStatus, { label: string; bg: string; color: string }> = {
  published: { label: "Publie", bg: "var(--ui-status-info-bg)", color: "var(--ui-status-info-text)" },
  draft: { label: "Brouillon", bg: "var(--ui-status-warning-bg)", color: "var(--ui-status-warning-text)" },
  completed: { label: "Termine", bg: "var(--ui-status-success-bg)", color: "var(--ui-status-success-text)" },
  archived: { label: "Archive", bg: "var(--ui-status-neutral-bg)", color: "var(--ui-status-neutral-text)" },
};

function getProjectInitials(title: string): string {
  const words = title.trim().split(/\s+/).slice(0, 2);
  return words.map((word) => word[0]?.toUpperCase() ?? "").join("") || "PR";
}

function SelectionCheckbox({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
        checked
          ? "border-blue-500 bg-blue-100 text-blue-700"
          : "border-blue-200 bg-slate-50 text-slate-500 hover:bg-blue-50",
      ].join(" ")}
    >
      {checked ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <span className="h-2.5 w-2.5 rounded-sm border border-current/70" />
      )}
    </button>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjects[0]?.id ?? "");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) return;
        const data = (await response.json()) as { projects?: Project[] };
        const incomingProjects = data.projects;
        if (!incomingProjects) return;
        setProjects(incomingProjects);
        setSelectedProjectId((prev) => prev || incomingProjects[0]?.id || "");
      } catch {
        // Keep local fallback data when API is unreachable.
      }
    }
    void loadProjects();
  }, []);

  async function handleDeleteProject(projectId: string, projectTitle: string) {
    const ok = window.confirm(`Supprimer le projet \"${projectTitle}\" ?`);
    if (!ok) return;

    const response = await fetch(`/api/projects?id=${projectId}`, { method: "DELETE" });
    if (!response.ok) {
      window.alert("La suppression du projet a echoue.");
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (selectedProjectId === projectId) {
      const next = projects.find((p) => p.id !== projectId);
      setSelectedProjectId(next?.id ?? "");
    }
    setSelectedProjectIds((prev) => prev.filter((id) => id !== projectId));
  }

  function toggleProjectSelection(projectId: string) {
    setSelectedProjectIds((prev) => (prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]));
  }

  function toggleSelectAllVisible() {
    const visibleIds = filteredProjects.map((project) => project.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProjectIds.includes(id));
    if (allSelected) {
      setSelectedProjectIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedProjectIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  }

  function updateSelectedStatus(nextStatus: ProjectStatus) {
    if (selectedProjectIds.length === 0) return;
    setProjects((prev) => prev.map((project) => (selectedProjectIds.includes(project.id) ? { ...project, status: nextStatus } : project)));
  }

  function deleteSelectedProjects() {
    if (selectedProjectIds.length === 0) return;
    const ok = window.confirm(`Supprimer ${selectedProjectIds.length} projet(s) selectionne(s) ?`);
    if (!ok) return;

    setProjects((prev) => prev.filter((project) => !selectedProjectIds.includes(project.id)));
    if (selectedProjectIds.includes(selectedProjectId)) {
      const next = projects.find((project) => !selectedProjectIds.includes(project.id));
      setSelectedProjectId(next?.id ?? "");
    }
    setSelectedProjectIds([]);
  }

  const filteredProjects = [...projects.filter((project) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = q === "" || project.title.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "" || project.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  })].sort((a, b) => {
    if (sortMode === "title") return a.title.localeCompare(b.title, "fr");
    if (sortMode === "status") return a.status.localeCompare(b.status);
    return Number(b.id) - Number(a.id);
  });

  const totalProjects = projects.length;
  const publishedCount = projects.filter((project) => project.status === "published").length;
  const featuredCount = projects.filter((project) => project.featured).length;

  const selectedProject = filteredProjects.find((project) => project.id === selectedProjectId) ?? filteredProjects[0] ?? null;
  const visibleIds = filteredProjects.map((project) => project.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProjectIds.includes(id));

  return (
    <div className="flex flex-col gap-5" style={{ animation: "fadeSlideUp 260ms ease-out both" }}>
      <div className="rounded-[26px] border border-blue-100 bg-blue-50 p-4 sm:p-5 lg:p-6" style={{ animation: "fadeSlideUp 320ms ease-out both" }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Project ops</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Catalogue projets</h1>
            <p className="mt-1 text-sm text-slate-600">{filteredProjects.length} projet{filteredProjects.length !== 1 ? "s" : ""} au total</p>
          </div>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nouveau projet
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3" style={{ animation: "fadeSlideUp 420ms ease-out both" }}>
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">Total</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">{totalProjects}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">Publies</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">{publishedCount}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 col-span-2 sm:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">Featured</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">{featuredCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1.22fr)_320px]" style={{ animation: "fadeSlideUp 520ms ease-out both" }}>
        <div className="rounded-3xl border border-blue-100 bg-white p-4 sm:p-5">
          <div className="rounded-2xl border border-blue-100 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Filtrage et affichage</p>
              <span className="inline-flex h-6 items-center rounded-full border border-blue-100 bg-blue-50 px-2 text-[11px] font-semibold text-blue-700">
                {filteredProjects.length} visible(s)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                aria-label="Rechercher un projet"
                placeholder="Rechercher un projet..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 w-full rounded-xl border border-blue-100 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
              />
            </div>
            <select
              aria-label="Filtrer par categorie"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-10 rounded-xl border border-blue-100 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
            >
              <option value="">Toutes catégories</option>
              <option value="ux-ui">UX/UI Design</option>
              <option value="frontend">Frontend Dev</option>
              <option value="branding">Branding</option>
            </select>
            <select
              aria-label="Filtrer par statut"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | ProjectStatus)}
              className="h-10 rounded-xl border border-blue-100 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
            >
              <option value="all">Tous statuts</option>
              <option value="published">Publie</option>
              <option value="draft">Brouillon</option>
              <option value="completed">Termine</option>
              <option value="archived">Archive</option>
            </select>
            <select
              aria-label="Trier les projets"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="h-10 rounded-xl border border-blue-100 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
            >
              <option value="recent">Tri: recents</option>
              <option value="title">Tri: titre</option>
              <option value="status">Tri: statut</option>
            </select>
            <div className="inline-flex items-center rounded-xl border border-blue-100 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={[
                  "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition",
                  viewMode === "grid" ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-100",
                ].join(" ")}
                title="Vue grille"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                Grille
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={[
                  "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition",
                  viewMode === "list" ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-100",
                ].join(" ")}
                title="Vue liste"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <circle cx="4" cy="6" r="1" />
                  <circle cx="4" cy="12" r="1" />
                  <circle cx="4" cy="18" r="1" />
                </svg>
                Liste
              </button>
            </div>
            </div>
          </div>

          <div className="sticky top-2 z-10 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-2 backdrop-blur">
            <div className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-slate-700">
              <SelectionCheckbox checked={allVisibleSelected} onToggle={toggleSelectAllVisible} label="Tout selectionner (visible)" />
              <span>Tout selectionner (visible)</span>
            </div>

            {selectedProjectIds.length > 0 ? (
              <div className="inline-flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 items-center rounded-lg bg-blue-100 px-2 text-xs font-semibold text-blue-700 whitespace-nowrap">{selectedProjectIds.length} selectionne(s)</span>
                <button
                  type="button"
                  onClick={() => updateSelectedStatus("published")}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-blue-200 bg-white px-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Publier
                </button>
                <button
                  type="button"
                  onClick={() => updateSelectedStatus("archived")}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-200 bg-white px-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="21 8 21 21 3 21 3 8" />
                    <rect x="1" y="3" width="22" height="5" />
                  </svg>
                  Archiver
                </button>
                <button
                  type="button"
                  onClick={deleteSelectedProjects}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-white px-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                  Supprimer
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-500">Selectionne un ou plusieurs projets pour appliquer une action.</span>
            )}
          </div>

          {viewMode === "grid" ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {filteredProjects.length === 0 ? (
                <div className="py-12 text-center sm:col-span-2 lg:col-span-3">
                  <p className="text-sm text-slate-400">Aucun projet trouve</p>
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                    className={[
                      "group overflow-hidden rounded-2xl border text-left transition-all duration-200",
                      selectedProjectId === project.id
                        ? "bg-white border-blue-400 shadow-[0_0_0_2px_rgba(59,130,246,0.18)]"
                        : "bg-white border-blue-100 hover:border-blue-300 hover:-translate-y-0.5",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-blue-100 bg-blue-50/70 px-3 py-2.5">
                      <div onClick={(event) => event.stopPropagation()}>
                        <SelectionCheckbox
                          checked={selectedProjectIds.includes(project.id)}
                          onToggle={() => toggleProjectSelection(project.id)}
                          label={`Selectionner le projet ${project.title}`}
                        />
                      </div>
                      <div className="inline-flex rounded-full border border-white/70 px-2.5 py-1 text-[10px] font-semibold" style={{ background: statusConfig[project.status].bg, color: statusConfig[project.status].color }}>
                        {statusConfig[project.status].label}
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="mb-3 flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 transition group-hover:bg-blue-100">
                          {getProjectInitials(project.title)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{project.title}</p>
                          <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400">{project.categoryLabel}</p>
                        </div>
                        {project.featured ? (
                          <span className="inline-flex h-6 items-center rounded-full border border-amber-200 bg-amber-50 px-2 text-[10px] font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-300">
                            Featured
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between gap-2 rounded-xl border border-blue-100 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {project.date}
                        </span>
                        <span className="font-semibold text-blue-700">Voir details</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-blue-100 bg-white">
              {filteredProjects.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">Aucun projet trouve</div>
              ) : (
                filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                    className={[
                      "grid w-full grid-cols-[32px_1fr_140px_110px] items-center gap-2 border-b border-blue-50 dark:border-slate-700 px-4 py-3 text-left transition last:border-b-0",
                      selectedProjectId === project.id ? "bg-blue-50" : "bg-white hover:bg-blue-50/40",
                    ].join(" ")}
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center" onClick={(event) => event.stopPropagation()}>
                      <SelectionCheckbox
                        checked={selectedProjectIds.includes(project.id)}
                        onToggle={() => toggleProjectSelection(project.id)}
                        label={`Selectionner le projet ${project.title}`}
                      />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-[10px] font-bold text-blue-700">
                          {getProjectInitials(project.title)}
                        </div>
                        <p className="truncate text-sm font-semibold text-slate-900">{project.title}</p>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                        <span>{project.categoryLabel}</span>
                        {project.featured ? <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-300">Featured</span> : null}
                      </div>
                    </div>
                    <span className="inline-flex w-fit rounded-full px-2 py-1 text-[10px] font-semibold" style={{ background: statusConfig[project.status].bg, color: statusConfig[project.status].color }}>
                      {statusConfig[project.status].label}
                    </span>
                    <span className="text-right text-[11px] font-medium text-slate-500">{project.date}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm xl:sticky xl:top-4 xl:self-start">
          {selectedProject ? (
            <>
              <div className="mb-3 flex aspect-[16/11] items-center justify-center rounded-xl border border-blue-100 bg-slate-50">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold" style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
                  {getProjectInitials(selectedProject.title)}
                </div>
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Details du projet</p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{selectedProject.title}</h3>

              <div className="mt-3 space-y-2.5 border-t border-blue-100 pt-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Categorie</p>
                  <p className="mt-0.5 text-sm text-slate-800">{selectedProject.categoryLabel}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Statut</p>
                  <span className="mt-0.5 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: statusConfig[selectedProject.status].bg, color: statusConfig[selectedProject.status].color }}>
                    {statusConfig[selectedProject.status].label}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Date</p>
                  <p className="mt-0.5 text-sm text-slate-800">{selectedProject.date}</p>
                </div>
                {selectedProject.featured ? (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-2.5 py-1.5 text-[11px] font-semibold text-yellow-700 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-300">
                    Featured
                  </div>
                ) : null}
              </div>

              <div className="mt-3 flex items-center justify-center gap-2 border-t border-blue-100 pt-3">
                <Link
                  href={`/dashboard/projects/${selectedProject.id}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition hover:opacity-90"
                  style={{ background: "#1D4ED8" }}
                  title="Voir"
                  aria-label="Voir le projet"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </Link>
                <Link
                  href={`/dashboard/projects/${selectedProject.id}/edit`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-300 text-blue-700 transition hover:bg-blue-50"
                  title="Modifier"
                  aria-label="Modifier le projet"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </Link>
                <button
                  type="button"
                  onClick={() => handleDeleteProject(selectedProject.id, selectedProject.title)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 text-red-600 transition hover:bg-red-50"
                  title="Supprimer"
                  aria-label="Supprimer le projet"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <p className="text-sm font-semibold text-slate-500">Selectionne un projet</p>
              <p className="mt-1 text-xs text-slate-400">pour afficher ses details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
