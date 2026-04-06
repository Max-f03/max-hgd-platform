import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import HeroCursors from "@/components/ui/HeroCursors";
import Image from "next/image";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-[calc(100svh-72px)] lg:min-h-[calc(100svh-84px)] flex items-start justify-center overflow-hidden px-4 pt-12 sm:pt-14 lg:pt-16 pb-8 lg:pb-10"
      style={{
        background: "radial-gradient(ellipse at top left, #dce8f8 0%, #ffffff 65%)",
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="landing-orb landing-orb-1" />
        <div className="landing-orb landing-orb-2" />
        <div className="landing-orb landing-orb-3" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto w-full flex flex-col items-center text-center gap-6 mt-8 sm:mt-10 lg:mt-12">
        <Reveal delay={0}>
          <div
            className="hero-avatar overflow-hidden mx-auto border-4 border-white mb-1"
            style={{
              width: "120px",
              height: "186px",
              borderRadius: "60px",
            }}
          >
            <Image
              src="/image/avatar.jpg"
              alt="Max-Fructueux HOUNGBEDJI"
              width={120}
              height={186}
              unoptimized
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="flex flex-col gap-2 pt-0">
            <h1
              className="hero-line-reveal text-[clamp(1.72rem,5vw,2.45rem)] font-normal text-neutral-900 leading-tight tracking-tight"
              style={{ fontStyle: "italic" }}
            >
              Je suis Max-Fructueux HOUNGBEDJI,
            </h1>
            <p
              className="hero-line-reveal hero-line-reveal-delay text-[clamp(1.28rem,4.2vw,1.95rem)] font-normal text-primary-500 leading-tight"
              style={{ fontStyle: "italic" }}
            >
              UX/UI Designer &amp; Frontend Developer
            </p>
            <p className="hero-fade-up hero-fade-up-delay max-w-md mx-auto text-sm text-neutral-500 leading-relaxed mt-2">
              Je concois des experiences digitales centrees utilisateur et je
              developpe des interfaces claires, efficaces et modernes.
            </p>
          </div>
        </Reveal>

        <Reveal delay={200}>
            <div className="hero-fade-up hero-fade-up-delay-2 flex w-full flex-wrap items-center justify-center gap-2 mt-2">
            <a href="#portfolio">
              <Button variant="primary" size="md" className="hero-cta-primary relative overflow-hidden w-full sm:w-auto justify-center gap-2 px-6 sm:px-7">
                <span className="hero-cta-shine" aria-hidden="true" />
                <span className="relative z-10 inline-flex items-center gap-2">
                  Voir mes projets
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12" height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </Button>
            </a>
            <a href="#contact">
              <Button variant="outline" size="md" className="w-full sm:w-auto justify-center px-6 sm:px-7 bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50">
                Me contacter
              </Button>
            </a>
          </div>
        </Reveal>
      </div>

      <p
        aria-hidden="true"
        className="hidden lg:block absolute right-[-100px] top-1/2 -translate-y-1/2 -rotate-90 text-[5.5rem] font-black tracking-widest text-neutral-100 uppercase select-none whitespace-nowrap leading-none pointer-events-none"
      >
        UX/UI Designer &amp; Frontend Developer
      </p>

      <HeroCursors />

    </section>
  );
}
