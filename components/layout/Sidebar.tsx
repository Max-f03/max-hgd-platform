"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";

const nav = [
  {
    section: "Principal",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
      { label: "Analytics", href: "/dashboard/analytics", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    ],
  },
  {
    section: "Gestion",
    items: [
      { label: "Projets",  href: "/dashboard/projects", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
      { label: "Clients",  href: "/dashboard/clients",  icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
      { label: "Messages", href: "/dashboard/messages", badge: 3, icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    ],
  },
  {
    section: "Compte",
    items: [
      { label: "Chatbot", href: "/dashboard/settings/chatbot", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
      { label: "Parametres", href: "/dashboard/settings", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();
  const [accountProfile, setAccountProfile] = useState<{ name: string; email: string; avatarUrl: string | null } | null>(null);

  const navItems = nav.flatMap((section) => section.items);

  const activeHref = navItems
    .map((item) => item.href)
    .sort((a, b) => b.length - a.length)
    .find((href) => {
      if (href === "/dashboard") return pathname === "/dashboard";
      return pathname === href || pathname.startsWith(`${href}/`);
    });

  const isActive = (href: string) => href === activeHref;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { account?: { profile?: { name?: string; email?: string; avatarUrl?: string | null } } };
        if (!mounted || !data.account?.profile) return;
        setAccountProfile({ name: data.account.profile.name ?? "Max HGD", email: data.account.profile.email ?? "", avatarUrl: data.account.profile.avatarUrl ?? null });
      } catch {}
    };
    void load();
    const handler = () => void load();
    window.addEventListener("account-profile-updated", handler);
    return () => { mounted = false; window.removeEventListener("account-profile-updated", handler); };
  }, []);

  const displayName = accountProfile?.name ?? session?.user?.name ?? "Max HGD";
  const displayEmail = accountProfile?.email ?? session?.user?.email ?? "";
  const avatarUrl = accountProfile?.avatarUrl ?? null;

  return (
    <aside
      className="flex flex-col h-full w-[260px]"
      style={{ background: "var(--d-sidebar)", borderRight: "1px solid var(--d-border)", transition: "background 0.25s ease" }}
    >
      {/* Logo + toggle */}
      <div className="px-5 py-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: "linear-gradient(135deg,#1D4ED8,#2563EB)" }}>
            M
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold" style={{ color: "var(--d-t1)" }}>Max HGD</span>
            <span className="text-xs mt-0.5" style={{ color: "var(--d-t4)" }}>Portfolio Admin</span>
          </div>
          <button
            type="button"
            onClick={toggle}
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
            className="ml-auto flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--d-t3)", background: "var(--d-input)" }}
          >
            {theme === "dark" ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {nav.map(({ section, items }) => (
          <div key={section} className="mb-5">
            <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--d-t4)" }}>
              {section}
            </p>
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={true}
                      className="flex items-center justify-between px-2.5 py-2 rounded-xl text-sm transition-all duration-150"
                      style={{
                        fontWeight: active ? 600 : 500,
                        background: active ? "var(--d-nav-act)" : "transparent",
                        color: active ? "var(--d-nav-actc)" : "var(--d-t3)",
                      }}
                    >
                      <span className="flex items-center gap-2.5">
                        {item.icon}
                        {item.label}
                      </span>
                      {"badge" in item && item.badge ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--d-badge-bg)", color: "var(--d-badge-c)" }}>
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-3 shrink-0 border-t" style={{ borderColor: "var(--d-border)" }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden text-white text-xs font-bold shrink-0" style={{ background: "#1D4ED8" }}>
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> : displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--d-t1)" }}>{displayName}</p>
            <p className="text-xs truncate" style={{ color: "var(--d-t4)" }}>{displayEmail}</p>
          </div>
          <button
            type="button"
            title="Se déconnecter"
            aria-label="Se deconnecter"
            onClick={() => void signOut({ callbackUrl: "/" })}
            className="ml-auto flex h-11 w-11 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            style={{ color: "var(--d-t3)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
