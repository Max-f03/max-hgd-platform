import Reveal from "@/components/ui/Reveal";

export default function About() {
  return (
    <section id="about" className="py-16 lg:py-20 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <Reveal variant="left">
          <div className="relative">
            <div className="relative aspect-[4/5] w-full max-w-sm mx-auto lg:mx-0 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-300" />
              <div className="absolute -bottom-2 -right-2 w-full h-full rounded-3xl border-4 border-primary-500 -z-10" />
              <div className="w-full h-full flex items-center justify-center text-primary-500 text-6xl font-bold">
                MH
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal variant="right" delay={100}>
          <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold tracking-widest uppercase text-primary-500">
              A propos
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-3xl font-medium text-neutral-900 leading-tight">
              Designer &amp; Developpeur passionne par l&apos;experience utilisateur
            </h2>
          </div>

          <div className="flex flex-col gap-4 text-neutral-600 leading-relaxed text-sm">
            <p>
              Designer UX/UI et developpeur frontend, je m&apos;interesse a la
              maniere dont les utilisateurs interagissent avec les produits
              digitaux.
            </p>
            <p>
              Mon approche repose sur la recherche utilisateur, la resolution
              de problemes concrets et la creation d&apos;interfaces accessibles et
              coherentes.
            </p>
            <p>
              Je travaille a l&apos;intersection du design et du code, ce qui me
              permet de creer des experiences non seulement belles, mais aussi
              techniquement solides et performantes.
            </p>
          </div>

          <p className="text-sm text-neutral-400 font-medium">
            Centre utilisateur &bull; Efficace &bull; Moderne
          </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
