import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";

interface SkillCategory {
  title: string;
  skills: string[];
  icon: React.ReactNode;
}

const categories: SkillCategory[] = [
  {
    title: "UX / UI Design",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    skills: [
      "UX Research",
      "Personas & User journey",
      "Wireframes",
      "Design system",
      "Prototypage (Figma)",
    ],
  },
  {
    title: "Frontend Development",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    skills: [
      "HTML / CSS / JavaScript",
      "React / Next.js",
      "Responsive design",
      "Accessibilite",
      "Integration UI",
    ],
  },
  {
    title: "Methodologie & outils",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    skills: [
      "Figma",
      "Git / GitHub",
      "Tests utilisateurs",
      "Methode agile",
      "Veille produit",
    ],
  },
];

export default function Skills() {
  return (
    <section id="skills" className="py-16 lg:py-20 px-4">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <Reveal>
          <div className="flex flex-col gap-3 text-center">
            <div className="flex justify-center">
              <span className="px-4 py-1.5 rounded-full bg-primary-50 text-primary-600 text-xs font-semibold tracking-widest uppercase">
                Competences
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-medium text-neutral-900">
              Ce que je sais faire
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto text-sm leading-relaxed">
              Des competences completes qui couvrent toute la chaine de creation
              d&apos;un produit digital
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <Reveal key={category.title} delay={(index * 100) as 0 | 100 | 200}>
            <Card className="flex flex-col gap-5 h-full">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 text-primary-500">
                  {category.icon}
                </div>
                <h3 className="font-medium text-neutral-900 text-sm">
                  {category.title}
                </h3>
              </div>
              <ul className="flex flex-col gap-2.5">
                {category.skills.map((skill) => (
                  <li key={skill} className="flex items-center gap-2.5 text-sm text-neutral-500">
                    <span className="w-1 h-1 rounded-full bg-primary-400 shrink-0" />
                    {skill}
                  </li>
                ))}
              </ul>
            </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
