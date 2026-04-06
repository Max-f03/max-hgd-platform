"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";

interface ClientProfile {
  id: string;
  initials: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: "lead" | "active" | "completed";
  avatarBg: string;
  lastContact: string;
  projects: Array<{
    id: string;
    title: string;
    status: "published" | "draft" | "archived";
  }>;
}

const mockClients: Record<string, ClientProfile> = {
  "1": {
    id: "1",
    initials: "AG",
    name: "Agence Crea",
    email: "contact@agencecrea.com",
    company: "Agence Crea",
    phone: "+33 1 23 45 67 89",
    status: "active",
    avatarBg: "bg-primary-100 text-primary-700",
    lastContact: "15 Mar 2025",
    projects: [
      { id: "1", title: "Mobile Booking App", status: "published" },
      { id: "5", title: "Site Corporate", status: "published" },
      { id: "3", title: "Design System", status: "draft" },
    ],
  },
  "2": {
    id: "2",
    initials: "TD",
    name: "Thomas Dupont",
    email: "t.dupont@email.com",
    company: "Freelance",
    phone: "+33 6 12 34 56 78",
    status: "lead",
    avatarBg: "bg-accent-100 text-accent-700",
    lastContact: "10 Mar 2025",
    projects: [{ id: "2", title: "E-commerce Platform", status: "published" }],
  },
  "3": {
    id: "3",
    initials: "SM",
    name: "Sophie Martin",
    email: "s.martin@tech.com",
    company: "TechCorp",
    phone: "+33 6 98 76 54 32",
    status: "active",
    avatarBg: "bg-green-100 text-green-700",
    lastContact: "8 Mar 2025",
    projects: [
      { id: "4", title: "Dashboard Analytics", status: "archived" },
      { id: "6", title: "Identite Visuelle Startup", status: "published" },
    ],
  },
};

const defaultClient: ClientProfile = {
  id: "0",
  initials: "??",
  name: "Client inconnu",
  email: "—",
  company: "—",
  phone: "—",
  status: "lead",
  avatarBg: "bg-neutral-100 text-neutral-500",
  lastContact: "—",
  projects: [],
};

const statusConfig = {
  lead: { label: "Lead", style: { background: "var(--ui-primary-soft)", color: "var(--ui-primary)" } },
  active: { label: "Actif", style: { background: "rgba(16,185,129,0.16)", color: "#10B981" } },
  completed: { label: "Complete", style: { background: "var(--d-input)", color: "var(--ui-text-secondary)" } },
};

const projectStatusConfig = {
  published: { label: "Publie", style: { background: "rgba(16,185,129,0.16)", color: "#10B981" } },
  draft: { label: "Brouillon", style: { background: "rgba(245,158,11,0.18)", color: "#D97706" } },
  archived: { label: "Archive", style: { background: "var(--d-input)", color: "var(--ui-text-secondary)" } },
};

interface ClientDetailPageProps {
  params: { id: string };
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const client = mockClients[params.id] ?? defaultClient;
  const status = statusConfig[client.status];

  const [notes, setNotes] = useState("");
  const [noteFeedback, setNoteFeedback] = useState("");

  useEffect(() => {
    async function loadNotes() {
      try {
        const response = await fetch(`/api/client-notes?clientId=${params.id}`);
        if (!response.ok) return;
        const data = (await response.json()) as { notes?: string };
        setNotes(data.notes ?? "");
      } catch {
        const saved = localStorage.getItem(`client-notes-${params.id}`) ?? "";
        setNotes(saved);
      }
    }
    void loadNotes();
  }, [params.id]);

  async function handleSaveNotes() {
    const response = await fetch("/api/client-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: params.id, notes }),
    });
    if (!response.ok) {
      setNoteFeedback("Echec de sauvegarde via API, sauvegarde locale effectuee.");
      localStorage.setItem(`client-notes-${params.id}`, notes);
      setTimeout(() => setNoteFeedback(""), 2500);
      return;
    }
    setNoteFeedback("Notes sauvegardees.");
    setTimeout(() => setNoteFeedback(""), 2200);
  }

  const timelineEvents = [
    { id: "created", label: "Client cree", date: "14 Mar 2025", detail: `${client.name} a ete ajoute au CRM.` },
    { id: "project", label: "Projet ajoute", date: client.lastContact, detail: client.projects[0] ? `Projet lie: ${client.projects[0].title}` : "Aucun projet lie pour le moment." },
    { id: "message", label: "Message envoye", date: "Aujourd'hui", detail: "Dernier echange capture dans la messagerie." },
    { id: "follow", label: "Suivi planifie", date: "Demain", detail: "Rappel de suivi client programme." },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <nav className="flex items-center gap-2 text-sm text-neutral-500" style={{ animation: "reveal-up 0.7s ease-out both" }}>
        <Link
          href="/dashboard/clients"
          className="hover:text-neutral-700 transition-colors"
        >
          Clients
        </Link>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18" height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neutral-300"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-neutral-900 font-medium">{client.name}</span>
      </nav>

      <div className="bg-white rounded-2xl p-6" style={{ animation: "reveal-up 0.7s ease-out both", animationDelay: "130ms" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={[
                "flex items-center justify-center w-16 h-16 rounded-2xl text-xl font-bold shrink-0",
                client.avatarBg,
              ].join(" ")}
            >
              {client.initials}
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-neutral-900">
                {client.name}
              </h2>
              <span className="text-sm text-neutral-500">{client.email}</span>
              <span
                className="inline-flex self-start px-2.5 py-1 rounded-full text-xs font-medium mt-1"
                style={status.style}
              >
                {status.label}
              </span>
            </div>
          </div>
          <Link href={`/dashboard/clients?edit=${params.id}`}>
            <Button variant="outline" size="sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18" height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1.5"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Modifier
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ animation: "reveal-up 0.7s ease-out both", animationDelay: "260ms" }}>
        <div className="bg-white rounded-2xl p-6">
          <h3 className="text-sm font-medium text-neutral-900 mb-4">
            Coordonnees
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-neutral-400 uppercase tracking-wide">
                Email
              </span>
              <span className="text-sm text-neutral-700">{client.email}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-neutral-400 uppercase tracking-wide">
                Telephone
              </span>
              <span className="text-sm text-neutral-700">{client.phone}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-neutral-400 uppercase tracking-wide">
                Entreprise
              </span>
              <span className="text-sm text-neutral-700">{client.company}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6">
          <h3 className="text-sm font-medium text-neutral-900 mb-4">
            Statistiques
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-sm text-neutral-500">Projets associes</span>
              <span className="text-sm font-semibold text-neutral-900">
                {client.projects.length}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-sm text-neutral-500">Statut actuel</span>
              <span
                className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                style={status.style}
              >
                {status.label}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-neutral-500">Dernier contact</span>
              <span className="text-sm text-neutral-700">
                {client.lastContact}
              </span>
            </div>
          </div>
        </div>
      </div>

      {client.projects.length > 0 && (
        <div className="bg-white rounded-2xl p-6">
          <h3 className="text-sm font-medium text-neutral-900 mb-4">
            Projets associes
          </h3>
          <div className="flex flex-col gap-2">
            {client.projects.map((project) => {
              const ps = projectStatusConfig[project.status];
              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0"
                >
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="text-sm font-medium text-neutral-800 hover:text-primary-600 transition-colors"
                  >
                    {project.title}
                  </Link>
                  <span
                    className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                    style={ps.style}
                  >
                    {ps.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6">
        <h3 className="text-sm font-medium text-neutral-900 mb-4">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ajouter des notes sur ce client..."
          rows={4}
          className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 resize-none"
        />
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" type="button" onClick={handleSaveNotes}>
            Sauvegarder les notes
          </Button>
        </div>
        {noteFeedback && (
          <p className="text-xs mt-2" style={{ color: "#2563EB" }}>
            {noteFeedback}
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-medium text-neutral-900">Timeline activite client</h3>
          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
            Hub CRM
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {timelineEvents.map((event, index) => (
            <div key={event.id} className="grid grid-cols-[auto_1fr] gap-3">
              <div className="flex flex-col items-center">
                <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
                {index < timelineEvents.length - 1 ? <span className="mt-1 h-full w-px bg-blue-100" /> : null}
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{event.label}</p>
                  <span className="text-[11px] font-medium text-slate-500">{event.date}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{event.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
