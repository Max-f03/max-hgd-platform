"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const nav = [
  {
    section: "Principal",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
      },
      {
        label: "Analytics",
        href: "/dashboard/analytics",
        icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
      },
    ],
  },
  {
    section: "Gestion",
    items: [
      {
        label: "Projets",
        href: "/dashboard/projects",
        icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
      },
      {
        label: "Clients",
        href: "/dashboard/clients",
        icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      },
      {
        label: "Messages",
        href: "/dashboard/messages",
        badge: 3,
        icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
      },
    ],
  },
  {
    section: "Compte",
    items: [
      {
        label: "Parametres",
        href: "/dashboard/settings",
        icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [accountProfile, setAccountProfile] = useState<{
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null>(null);
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  useEffect(() => {
    let mounted = true;

    const loadAccount = async () => {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          account?: {
            profile?: {
              name?: string;
              email?: string;
              avatarUrl?: string | null;
            };
          };
        };
        if (!mounted || !data.account?.profile) return;

        setAccountProfile({
          name: data.account.profile.name ?? "Max HGD",
          email: data.account.profile.email ?? "",
          avatarUrl: data.account.profile.avatarUrl ?? null,
        });
      } catch {
        // Ignore temporary network errors.
      }
    };

    const onProfileUpdated = () => {
      void loadAccount();
    };

    void loadAccount();
    window.addEventListener("account-profile-updated", onProfileUpdated);

    return () => {
      mounted = false;
      window.removeEventListener("account-profile-updated", onProfileUpdated);
    };
  }, []);

  const displayName = accountProfile?.name ?? session?.user?.name ?? "Max HGD";
  const displayEmail = accountProfile?.email ?? session?.user?.email ?? "";
  const avatarUrl = accountProfile?.avatarUrl ?? null;

  return (
    <aside className="flex flex-col h-full w-[260px] bg-white">

      {/* Logo */}
      <div className="px-5 py-5 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)" }}
          >
            M
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold" style={{ color: "#0F172A" }}>Max HGD</span>
            <span className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Portfolio Admin</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {nav.map(({ section, items }) => (
          <div key={section} className="mb-5">
            <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#94A3B8" }}>
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
                      className={[
                        "flex items-center justify-between px-2.5 py-2 rounded-xl text-sm transition-all duration-150",
                        active
                          ? "bg-blue-50/90 text-blue-700"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                      ].join(" ")}
                      style={{ fontWeight: active ? 600 : 500 }}
                    >
                      <span className="flex items-center gap-2.5">
                        {item.icon}
                        {item.label}
                      </span>
                      {"badge" in item && item.badge ? (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: "#DBEAFE", color: "#1E40AF" }}
                        >
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
      <div className="px-3 py-3 shrink-0 border-t" style={{ borderColor: "#F1F5F9" }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden text-white text-xs font-bold shrink-0"
            style={{ background: "#1D4ED8" }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar utilisateur" className="h-full w-full object-cover" />
            ) : (
              displayName.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#0F172A" }}>
              {displayName}
            </p>
            <p className="text-xs truncate" style={{ color: "#94A3B8" }}>
              {displayEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Se deconnecter"
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-red-50"
            style={{ color: "#94A3B8" }}
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
