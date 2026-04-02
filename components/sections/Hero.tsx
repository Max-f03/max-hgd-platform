import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import HeroCursors from "@/components/ui/HeroCursors";
import Image from "next/image";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-28 pb-20"
      style={{
        background: "radial-gradient(ellipse at top left, #dce8f8 0%, #ffffff 65%)",
      }}
    >
      <div className="relative z-10 max-w-3xl mx-auto w-full flex flex-col items-center text-center gap-8">
        <Reveal delay={0}>
          <div
            className="overflow-hidden mx-auto border-4 border-white"
            style={{
              width: "140px",
              height: "220px",
              borderRadius: "70px",
            }}
          >
            <Image
              src="/IMAGE/avatar.jpg"
              alt="Max-Fructueux HOUNGBEDJI"
              width={140}
              height={220}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="flex flex-col gap-2">
            <h1
              className="text-4xl sm:text-5xl font-normal text-neutral-900 leading-tight tracking-tight"
              style={{ fontStyle: "italic" }}
            >
              Je suis Max-Fructueux HOUNGBEDJI,
            </h1>
            <p
              className="text-3xl sm:text-4xl font-normal text-primary-500 leading-tight"
              style={{ fontStyle: "italic" }}
            >
              UX/UI Designer &amp; Frontend Developer
            </p>
            <p className="max-w-md mx-auto text-base text-neutral-500 leading-relaxed mt-3">
              Je concois des experiences digitales centrees utilisateur et je
              developpe des interfaces claires, efficaces et modernes.
            </p>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
            <a href="#portfolio">
              <Button variant="primary" size="lg" className="gap-2 px-8">
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
              </Button>
            </a>
            <a href="#contact">
              <Button variant="outline" size="lg" className="px-8 bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50">
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
