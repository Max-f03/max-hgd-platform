"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const linksLeft = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Competences", href: "#skills" },
];

const linksRight = [
  { label: "Portfolio", href: "#portfolio" },
  { label: "Processus", href: "#process" },
  { label: "Contact", href: "#contact" },
];

const allLinks = [...linksLeft, ...linksRight];
const sectionIds = ["home", "about", "skills", "portfolio", "process", "contact"];

export default function Navbar() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHomePage = pathname === "/";
  const derivedSection = isHomePage
    ? activeSection
    : pathname.startsWith("/projects")
      ? "portfolio"
      : "home";

  const resolveHref = (anchorHref: string) => {
    if (isHomePage) return anchorHref;
    return `/${anchorHref}`;
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    if (!isHomePage) {
      return;
    }

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { threshold: 0.3 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [isHomePage, pathname]);

  useEffect(() => {
    if (!isHomePage) return;

    const syncFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (sectionIds.includes(hash)) {
        setActiveSection(hash);
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [isHomePage]);

  const linkClass = (href: string) => {
    const id = href.replace("#", "");
    const isActive = derivedSection === id;
    return [
      "px-2.5 xl:px-3 py-1.5 rounded-full text-xs xl:text-sm transition-colors duration-200",
      isActive ? "text-white font-medium" : "text-neutral-400 hover:text-white",
    ].join(" ");
  };

  const mobileLinkClass = (href: string) => {
    const id = href.replace("#", "");
    const isActive = derivedSection === id;
    return [
      "flex items-center gap-3 px-5 py-3.5 text-sm transition-colors duration-200",
      isActive
        ? "text-white font-medium"
        : "text-neutral-400 hover:text-neutral-200",
    ].join(" ");
  };

  return (
    <header className="fixed top-3 sm:top-4 left-0 right-0 z-50 flex justify-center px-3 sm:px-4">
      <nav
        className={[
          "hidden lg:flex items-center rounded-full px-4 xl:px-6 gap-1.5 xl:gap-2 transition-all duration-500",
          scrolled
            ? "bg-neutral-900 py-2"
            : "bg-neutral-900/75 py-3 backdrop-blur-md",
        ].join(" ")}
      >
        {linksLeft.map((link) => (
          <a key={link.href} href={resolveHref(link.href)} className={linkClass(link.href)}>
            {link.label}
          </a>
        ))}

        <a
          href={resolveHref("#home")}
          className="mx-4 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[11px] font-bold text-white transition-transform duration-200 hover:scale-105"
          aria-label="Accueil"
          title="Retour accueil"
        />

        {linksRight.map((link) => (
          <a key={link.href} href={resolveHref(link.href)} className={linkClass(link.href)}>
            {link.label}
          </a>
        ))}
      </nav>

      <div
        className={[
          "flex lg:hidden items-center justify-between w-full rounded-full px-4 sm:px-5 transition-all duration-500",
          scrolled
            ? "bg-neutral-900 py-2.5"
            : "bg-neutral-900/75 py-3 backdrop-blur-md",
        ].join(" ")}
      >
        <a
          href={resolveHref("#home")}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[11px] font-bold text-white"
          aria-label="Accueil"
          title="Retour accueil"
        />

        <span className="text-white/60 text-xs font-medium tracking-wide uppercase">
          {allLinks.find((l) => l.href === `#${derivedSection}`)?.label ?? "Menu"}
        </span>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white transition-colors duration-200"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="animate-slide-down absolute top-full mt-2 left-3 right-3 sm:left-4 sm:right-4 bg-neutral-900 rounded-2xl overflow-hidden lg:hidden border border-white/5">
          <ul className="flex flex-col py-2">
            {allLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={resolveHref(link.href)}
                  onClick={() => setMenuOpen(false)}
                  className={mobileLinkClass(link.href)}
                >
                  <span
                    className={[
                      "w-1 h-1 rounded-full shrink-0 transition-colors duration-200",
                      derivedSection === link.href.replace("#", "")
                        ? "bg-primary-400"
                        : "bg-transparent",
                    ].join(" ")}
                  />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
