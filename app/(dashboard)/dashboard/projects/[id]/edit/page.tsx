"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProjectForm, { type ProjectFormData } from "@/components/dashboard/ProjectForm";

function mapProjectToInitial(project: {
  title: string;
  category: string;
  status: "draft" | "published" | "completed" | "archived";
  featured: boolean;
}): Partial<ProjectFormData> {
  return {
    title: project.title,
    slug: project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    shortDescription: "",
    category: project.category,
    status: project.status,
    featured: project.featured,
  };
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = String(params?.id ?? "");

  const [initialData, setInitialData] = useState<Partial<ProjectFormData> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) {
          setLoading(false);
          return;
        }

        const data = (await response.json()) as {
          projects?: Array<{
            id: string;
            title: string;
            category: string;
            status: "draft" | "published" | "completed" | "archived";
            featured: boolean;
          }>;
        };

        const project = data.projects?.find((item) => item.id === projectId);
        if (project) {
          setInitialData(mapProjectToInitial(project));
        }
      } finally {
        setLoading(false);
      }
    }

    if (!projectId) {
      setLoading(false);
      return;
    }

    void loadProject();
  }, [projectId]);

  async function handleSubmit(data: ProjectFormData, action: "draft" | "publish") {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: projectId,
        data: {
          ...data,
          status: action === "publish" ? "published" : "draft",
          featured: data.featured,
        },
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      window.alert(payload?.error || "La sauvegarde du projet modifie a echoue.");
      return;
    }

    router.push("/dashboard/projects");
  }

  if (loading) {
    return <p className="text-sm" style={{ color: "#64748B" }}>Chargement du projet...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-2 text-sm text-neutral-500" style={{ animation: "reveal-up 0.7s ease-out both" }}>
        <Link href="/dashboard/projects" className="hover:text-neutral-700 transition-colors">
          Projets
        </Link>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-300">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-neutral-900 font-medium">Modifier projet</span>
      </nav>

      <div style={{ animation: "reveal-up 0.7s ease-out both", animationDelay: "120ms" }}>
        <ProjectForm
          formKey={`edit-project-${projectId}`}
          initialData={initialData ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/dashboard/projects")}
        />
      </div>
    </div>
  );
}
