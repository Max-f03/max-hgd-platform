"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";

type Category = "Tous" | "UX/UI Design" | "Frontend Dev" | "Branding";

interface Project {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: Exclude<Category, "Tous">;
  tag: string;
  tagColor: string;
  gradient: string;
  categoryColor: string;
  featured?: boolean;
}

const filters: Category[] = ["Tous", "UX/UI Design", "Frontend Dev", "Branding"];

const projects: Project[] = [
  {
    id: 1,
    slug: "mobile-booking-app",
    title: "Application mobile de reservation",
    description: "Refonte complete de l'experience utilisateur d'une app de reservation",
    category: "UX/UI Design",
    tag: "Mobile",
    tagColor: "#1E40AF",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    categoryColor: "text-primary-500",
    featured: true,
  },
  {
    id: 2,
    slug: "ecommerce-platform",
    title: "Plateforme E-commerce",
    description: "Boutique en ligne moderne et performante",
    category: "Frontend Dev",
    tag: "Web",
    tagColor: "#9D174D",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    categoryColor: "text-accent-500",
  },
  {
    id: 3,
    slug: "design-system",
    title: "Design System",
    description: "Systeme de design coherent et scalable",
    category: "UX/UI Design",
    tag: "Design System",
    tagColor: "#0891B2",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    categoryColor: "text-primary-500",
  },
  {
    id: 4,
    slug: "analytics-dashboard",
    title: "Dashboard Analytics",
    description: "Interface de visualisation de donnees complexes",
    category: "Frontend Dev",
    tag: "Web App",
    tagColor: "#065F46",
    gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    categoryColor: "text-accent-500",
  },
  {
    id: 5,
    slug: "corporate-website",
    title: "Site Corporate",
    description: "Refonte complete de l'identite digitale d'une entreprise",
    category: "UX/UI Design",
    tag: "Website",
    tagColor: "#92400E",
    gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    categoryColor: "text-primary-500",
  },
  {
    id: 6,
    slug: "saas-application",
    title: "Application SaaS",
    description: "App web complexe et scalable",
    category: "Frontend Dev",
    tag: "SaaS",
    tagColor: "#1D4ED8",
    gradient: "linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)",
    categoryColor: "text-accent-500",
  },
];

export default function Portfolio() {
  const [activeFilter, setActiveFilter] = useState<Category>("Tous");
  const [projectList, setProjectList] = useState<Project[]>(projects);

  useEffect(() => {
    async function loadPublicProjects() {
      try {
        const response = await fetch("/api/projects?scope=public", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as { projects?: Array<Omit<Project, "id"> & { id: string }> };
        if (!Array.isArray(data.projects) || data.projects.length === 0) return;

        setProjectList(
          data.projects.map((project, index) => ({
            ...project,
            id: Number(project.id) || index + 1,
          }))
        );
      } catch {
        // Keep static fallback projects when API is unavailable.
      }
    }

    void loadPublicProjects();
  }, []);

  const filtered =
    activeFilter === "Tous"
      ? projectList
      : projectList.filter((p) => p.category === activeFilter);

  return (
    <section id="portfolio" className="py-16 sm:py-20 lg:py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col gap-10 sm:gap-12 lg:gap-14">
        <Reveal>
          <div className="flex flex-col gap-3 text-center">
            <div className="flex justify-center">
              <span className="px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium tracking-widest uppercase">
                Portfolio
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium text-neutral-900">
              Mes projets recents
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto text-sm leading-relaxed">
              Une selection de projets qui illustrent mon approche et mes competences
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={[
                  "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200",
                  activeFilter === filter
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-500 border border-neutral-200 hover:border-neutral-400 hover:text-neutral-900",
                ].join(" ")}
              >
                {filter}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="bg-white border border-neutral-200 rounded-2xl overflow-hidden group transition-all duration-300 h-full flex flex-col"
              >
                <div
                  className="relative h-32 sm:h-36"
                  style={{ background: project.gradient }}
                >
                  <span
                    className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded text-xs font-medium"
                    style={{ color: project.tagColor }}
                  >
                    {project.tag}
                  </span>
                  {project.featured && (
                    <span className="absolute top-2 right-2 bg-black/40 text-white px-2 py-0.5 rounded text-xs">
                      Featured
                    </span>
                  )}
                </div>
                <div className="p-4 sm:p-5 lg:p-6 flex flex-col gap-2 flex-1">
                  <span className={`text-xs font-medium uppercase tracking-wide ${project.categoryColor}`}>
                    {project.category}
                  </span>
                  <h3 className="font-medium text-neutral-900 text-sm sm:text-base">
                    {project.title}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    {project.description}
                  </p>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-500 hover:text-primary-700 transition-colors duration-200 mt-1"
                  >
                    Voir le projet
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={300}>
        <div className="flex justify-center">
          <Link
            href="/projects"
            className="w-full sm:w-auto text-center px-6 sm:px-8 py-3 rounded-full border border-neutral-300 text-sm font-medium text-neutral-700 hover:border-neutral-500 hover:text-neutral-900 transition-colors duration-200"
          >
            Decouvrir plus de projets
          </Link>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
