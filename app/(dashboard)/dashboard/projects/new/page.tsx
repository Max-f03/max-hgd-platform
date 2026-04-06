"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ProjectForm, { type ProjectFormData } from "@/components/dashboard/ProjectForm";

function NewProjectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("clientId") ?? "";
  const [creationMessage, setCreationMessage] = useState("");

  async function handleSubmit(data: ProjectFormData, action: "draft" | "publish") {
    setCreationMessage("Creation du projet...");
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectType: data.projectType,
        workflow: {
          mode: data.workflowMode,
          templateKey: data.workflowTemplate,
          duplicateProjectId: data.duplicateFromProjectId || undefined,
        },
        data: {
          ...data,
          category: data.category,
          status: action === "publish" ? "published" : "draft",
          featured: data.featured,
        },
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          error?: string;
          project?: { id?: string };
          workflow?: { label?: string; mode?: string; createdTaskCount?: number };
        }
      | null;

    if (!response.ok) {
      window.alert(payload?.error || "La creation du projet a echoue.");
      setCreationMessage("");
      return;
    }

    const projectId = payload?.project?.id;
    if (!projectId) {
      setCreationMessage("");
      router.push("/dashboard/projects");
      return;
    }

    const workflowLabel = payload?.workflow?.label ?? "workflow standard";
    const generatedTasks = String(payload?.workflow?.createdTaskCount ?? 0);
    setCreationMessage(`Projet cree avec workflow \"${workflowLabel}\"`);
    router.push(
      `/dashboard/projects/${projectId}?created=1&workflow=${encodeURIComponent(workflowLabel)}&generatedTasks=${generatedTasks}`
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {creationMessage ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
          {creationMessage}
        </div>
      ) : null}

      <div className="rounded-[26px] border border-blue-100 bg-blue-50 p-4 sm:p-5 lg:p-6" style={{ animation: "fadeSlideUp 320ms ease-out both" }}>
        <nav className="mb-3 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard/projects" className="transition-colors hover:text-slate-700">
            Projets
          </Link>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="font-medium text-slate-900">Nouveau projet</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Project creation</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Créer un nouveau projet</h2>
            <p className="mt-1 text-sm text-slate-600">Renseignez les sections ci-dessous pour publier un projet clair, complet et bien reference.</p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/projects")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Retour aux projets
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3" style={{ animation: "fadeSlideUp 420ms ease-out both" }}>
          <div className="rounded-xl border border-blue-100 bg-white px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">Etape 1</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Informations de base</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">Etape 2</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Medias et contenu</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">Etape 3</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">SEO et publication</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.65fr_320px]" style={{ animation: "fadeSlideUp 520ms ease-out both" }}>
        <div>
          <ProjectForm
            formKey={`new-project-${preselectedClientId || "default"}`}
            initialData={preselectedClientId ? { clientId: preselectedClientId } : undefined}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/dashboard/projects")}
          />
        </div>

        <aside className="rounded-3xl border border-blue-100 bg-white p-4 sm:p-5 xl:sticky xl:top-20 xl:h-fit">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-700">Checklist rapide</p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              <li>• Titre clair et descriptif</li>
              <li>• Description courte utile</li>
              <li>• Image de couverture qualitative</li>
              <li>• Liens externes verifies</li>
            </ul>
          </div>

          <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Conseil SEO</p>
            <p className="mt-1 text-sm text-slate-700">Ajoutez un meta title court et une description orientee resultat pour ameliorer la visibilite du projet.</p>
          </div>

          <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Publication</p>
            <p className="mt-1 text-sm text-slate-700">Vous pouvez sauvegarder en brouillon puis publier quand tout est pret.</p>
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
      `}</style>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-500">Chargement du formulaire...</div>}>
      <NewProjectPageContent />
    </Suspense>
  );
}
