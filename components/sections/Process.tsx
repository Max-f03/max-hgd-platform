interface Step {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    number: "01",
    title: "Comprendre le probleme",
    description: "Recherche utilisateur et analyse des besoins",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Concevoir la solution",
    description: "UX flows, wireframes et structure",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Designer & developper",
    description: "UI design et integration frontend",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Tester & ameliorer",
    description: "Tests utilisateurs et iterations",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
];

import Reveal from "@/components/ui/Reveal";

export default function Process() {
  return (
    <section id="process" className="py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <Reveal>
          <div className="flex flex-col gap-3 text-center">
            <div className="flex justify-center">
              <span className="px-4 py-1.5 rounded-full bg-primary-50 text-primary-600 text-xs font-semibold tracking-widest uppercase">
                Processus
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-medium text-neutral-900">
              Ma facon de travailler
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto text-sm leading-relaxed">
              Une approche structuree et iterative pour creer des solutions qui
              repondent aux vrais besoins
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, index) => (
            <Reveal key={step.number} delay={(index * 100) as 0 | 100 | 200 | 300}>
            <div
              className="flex flex-col gap-4 bg-white border border-neutral-200 rounded-2xl p-6 h-full"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 text-primary-500">
                  {step.icon}
                </div>
                <span className="text-2xl font-black text-neutral-100 select-none">
                  {step.number}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-medium text-neutral-900 text-sm">{step.title}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
