import Link from "next/link";
import prisma from "@/lib/prisma";

const categoryLabelMap: Record<string, string> = {
  "ux-ui": "UX/UI Design",
  frontend: "Frontend Dev",
  branding: "Branding",
  other: "Autre",
};

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { status: "published" },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return (
    <section className="bg-white pt-40 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900">Tous les projets</h1>
          <p className="mt-2 text-sm text-neutral-500">Selection complete des projets publies avec details.</p>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
            Aucun projet publie pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const start = project.colors[0] ?? "#43a7e8";
              const end = project.colors[1] ?? "#19d2dc";
              return (
                <article key={project.id} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden flex flex-col">
                  <div className="relative h-36" style={{ background: `linear-gradient(135deg, ${start} 0%, ${end} 100%)` }}>
                    <span className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded text-xs font-medium text-blue-700">
                      {project.tags[0] ?? "Projet"}
                    </span>
                    {project.featured ? (
                      <span className="absolute top-2 right-2 bg-black/40 text-white px-2 py-0.5 rounded text-xs">Featured</span>
                    ) : null}
                  </div>

                  <div className="p-4 flex-1 flex flex-col gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-primary-500">
                      {categoryLabelMap[project.category] ?? "Autre"}
                    </span>
                    <h2 className="text-lg font-semibold text-neutral-900 leading-snug">{project.title}</h2>
                    <p className="text-sm text-neutral-500 leading-relaxed">{project.description ?? "Sans description."}</p>
                    <Link href={`/projects/${project.slug}`} className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-primary-700 transition-colors">
                      Voir le projet
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
