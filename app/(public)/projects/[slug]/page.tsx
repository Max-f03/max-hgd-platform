/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

type RichBlock = {
  id: string;
  type: "text" | "image" | "gallery" | "video" | "quote" | "comparison" | "code" | "embed";
  data: {
    title?: string;
    paragraph?: string;
    image?: { url?: string; name?: string } | null;
    caption?: string;
    gallery?: Array<{ url?: string; name?: string }>;
    videoUrl?: string;
    quoteText?: string;
    quoteAuthor?: string;
    beforeImage?: { url?: string; name?: string } | null;
    afterImage?: { url?: string; name?: string } | null;
    code?: string;
    language?: string;
    embedUrl?: string;
  };
};

const categoryLabelMap: Record<string, string> = {
  "ux-ui": "UX/UI Design",
  frontend: "Frontend Dev",
  branding: "Branding",
  other: "Autre",
};

function asBlocks(raw: unknown): RichBlock[] {
  if (!raw || typeof raw !== "object") return [];
  const value = raw as { blocks?: unknown };
  if (!Array.isArray(value.blocks)) return [];
  return value.blocks as RichBlock[];
}

function asRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  return raw as Record<string, unknown>;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project || project.status !== "published") {
    notFound();
  }

  const allPublished = await prisma.project.findMany({
    where: { status: "published" },
    orderBy: [{ order: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    select: { slug: true, title: true },
  });

  const currentIndex = allPublished.findIndex((item) => item.slug === project.slug);
  const prevProject = currentIndex > 0 ? allPublished[currentIndex - 1] : null;
  const nextProject = currentIndex >= 0 && currentIndex < allPublished.length - 1 ? allPublished[currentIndex + 1] : null;

  const blocks = asBlocks(project.content);
  const seo = asRecord(project.seo);
  const testimonial = asRecord(project.testimonial);

  const gradientStart = project.colors[0] ?? "#43a7e8";
  const gradientEnd = project.colors[1] ?? "#19d2dc";

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="relative h-52 sm:h-64 rounded-2xl overflow-hidden mb-6 flex items-end p-6" style={{ background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <div className="relative z-10 text-white">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs">{categoryLabelMap[project.category] ?? "Autre"}</span>
              {project.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="bg-white/20 px-3 py-1 rounded-full text-xs">{tag}</span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold">{project.title}</h1>
            <p className="text-sm text-white/90 mt-1">{project.description ?? "Sans description."}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-neutral-50 rounded-2xl p-4 mb-8">
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">Statut</p>
                <p className="text-sm font-medium text-neutral-900">{project.status}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">Publication</p>
                <p className="text-sm font-medium text-neutral-900">{(project.publishedAt ?? project.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">Technologies</p>
                <p className="text-sm font-medium text-neutral-900">{project.technologies.length}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">Views</p>
                <p className="text-sm font-medium text-neutral-900">{project.views}</p>
              </div>
            </div>

            <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-3">Vue d&apos;ensemble</h2>
            <p className="text-sm text-neutral-600 leading-relaxed">{project.description ?? "Aucune vue d'ensemble renseignee."}</p>
          </section>

          {project.technologies.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">Technologies utilisees</h2>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span key={tech} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{tech}</span>
                ))}
              </div>
            </section>
          )}

          {project.images.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">Galerie</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.images.map((imageUrl, index) => (
                  <div key={`${imageUrl}-${index}`} className="overflow-hidden rounded-xl border border-neutral-200">
                    <img src={imageUrl} alt={`Capture ${index + 1}`} className="h-52 w-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {blocks.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">Details du projet</h2>
              <div className="space-y-4">
                {blocks.map((block) => {
                  if (block.type === "text") {
                    return (
                      <article key={block.id} className="rounded-2xl border border-neutral-200 p-4 bg-white">
                        {block.data.title ? <h3 className="text-base font-semibold text-neutral-900 mb-2">{block.data.title}</h3> : null}
                        <p className="text-sm text-neutral-600 leading-relaxed">{block.data.paragraph ?? ""}</p>
                      </article>
                    );
                  }

                  if (block.type === "image" && block.data.image?.url) {
                    return (
                      <article key={block.id} className="rounded-2xl border border-neutral-200 overflow-hidden bg-white">
                        <img src={block.data.image.url} alt={block.data.image.name ?? "Image"} className="w-full h-72 object-cover" />
                        {block.data.caption ? <p className="px-4 py-3 text-xs text-neutral-500">{block.data.caption}</p> : null}
                      </article>
                    );
                  }

                  if (block.type === "gallery" && Array.isArray(block.data.gallery) && block.data.gallery.length > 0) {
                    return (
                      <article key={block.id} className="rounded-2xl border border-neutral-200 p-4 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {block.data.gallery.map((image, index) => (
                            <img key={`${image.url ?? "gallery"}-${index}`} src={image.url ?? ""} alt={image.name ?? `Image ${index + 1}`} className="w-full h-52 rounded-xl object-cover" />
                          ))}
                        </div>
                      </article>
                    );
                  }

                  if (block.type === "video" && block.data.videoUrl) {
                    return (
                      <article key={block.id} className="rounded-2xl border border-neutral-200 p-4 bg-white">
                        <a href={block.data.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700">
                          Ouvrir la video du projet
                        </a>
                      </article>
                    );
                  }

                  if (block.type === "quote" && block.data.quoteText) {
                    return (
                      <article key={block.id} className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <p className="text-sm italic text-slate-700">&quot;{block.data.quoteText}&quot;</p>
                        {block.data.quoteAuthor ? <p className="mt-2 text-xs font-semibold text-blue-700">{block.data.quoteAuthor}</p> : null}
                      </article>
                    );
                  }

                  if (block.type === "comparison" && (block.data.beforeImage?.url || block.data.afterImage?.url)) {
                    return (
                      <article key={block.id} className="rounded-2xl border border-neutral-200 p-4 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {block.data.beforeImage?.url ? <img src={block.data.beforeImage.url} alt="Avant" className="w-full h-52 rounded-xl object-cover" /> : <div className="h-52 rounded-xl bg-neutral-100" />}
                          {block.data.afterImage?.url ? <img src={block.data.afterImage.url} alt="Apres" className="w-full h-52 rounded-xl object-cover" /> : <div className="h-52 rounded-xl bg-neutral-100" />}
                        </div>
                      </article>
                    );
                  }

                  if (block.type === "code" && block.data.code) {
                    return (
                      <article key={block.id} className="rounded-2xl border border-neutral-200 p-4 bg-neutral-950 text-neutral-100 overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{block.data.code}</pre>
                      </article>
                    );
                  }

                  if (block.type === "embed" && block.data.embedUrl) {
                    return (
                      <article key={block.id} className="rounded-2xl border border-neutral-200 p-4 bg-white">
                        <a href={block.data.embedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700">
                          Ouvrir le contenu integre
                        </a>
                      </article>
                    );
                  }

                  return null;
                })}
              </div>
            </section>
          )}

          {(project.liveUrl || project.githubUrl || project.figmaUrl) && (
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">Liens du projet</h2>
              <div className="flex flex-wrap gap-2">
                {project.liveUrl ? <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">Site live</a> : null}
                {project.githubUrl ? <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700">GitHub</a> : null}
                {project.figmaUrl ? <a href={project.figmaUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700">Figma</a> : null}
              </div>
            </section>
          )}

          {(asString(testimonial.text) || asString(testimonial.clientName)) && (
            <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p className="text-sm italic text-amber-900">&quot;{asString(testimonial.text)}&quot;</p>
              <p className="mt-2 text-xs font-semibold text-amber-700">{asString(testimonial.clientName)} {asString(testimonial.roleCompany) ? `- ${asString(testimonial.roleCompany)}` : ""}</p>
            </section>
          )}

          {(asString(seo.title) || asString(seo.description)) && (
            <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <h2 className="text-sm font-semibold text-neutral-900">SEO renseigne</h2>
              {asString(seo.title) ? <p className="mt-2 text-xs text-neutral-600">Titre SEO: {asString(seo.title)}</p> : null}
              {asString(seo.description) ? <p className="mt-1 text-xs text-neutral-600">Description SEO: {asString(seo.description)}</p> : null}
            </section>
          )}
            </div>

          </div>

          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Informations rapides</p>
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-neutral-700"><span className="font-semibold text-neutral-900">Projet:</span> {project.title}</p>
                <p className="text-neutral-700"><span className="font-semibold text-neutral-900">Categorie:</span> {categoryLabelMap[project.category] ?? "Autre"}</p>
                <p className="text-neutral-700"><span className="font-semibold text-neutral-900">Publication:</span> {(project.publishedAt ?? project.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>
            </div>

            {project.technologies.length > 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Stack</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <span key={tech} className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">{tech}</span>
                  ))}
                </div>
              </div>
            )}

            {(project.liveUrl || project.githubUrl || project.figmaUrl) && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Liens utiles</p>
                <div className="mt-3 flex flex-col gap-2">
                  {project.liveUrl ? <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">Voir le site live</a> : null}
                  {project.githubUrl ? <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700">Code GitHub</a> : null}
                  {project.figmaUrl ? <a href={project.figmaUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700">Prototype Figma</a> : null}
                </div>
              </div>
            )}
          </aside>

          <div className="lg:col-span-2 flex items-center gap-3 pt-6 border-t border-neutral-100">
            {prevProject ? (
              <Link href={`/projects/${prevProject.slug}`} className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-200 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Projet precedent
              </Link>
            ) : null}

            {nextProject ? (
              <Link href={`/projects/${nextProject.slug}`} className="ml-auto bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-200 flex items-center gap-1.5">
                Projet suivant
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
