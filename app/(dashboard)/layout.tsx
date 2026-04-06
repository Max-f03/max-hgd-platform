"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { useTheme } from "@/components/ThemeProvider";

function NavigationBar() {
  const pathname = usePathname();
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const prev = useRef(pathname);

  useEffect(() => {
    if (pathname !== prev.current) {
      prev.current = pathname;
      setStatus("done");
      const t = setTimeout(() => setStatus("idle"), 500);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      const a = (e.target as Element).closest("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto")) return;
      setStatus("loading");
    }
    document.addEventListener("click", onLinkClick);
    return () => document.removeEventListener("click", onLinkClick);
  }, []);

  if (status === "idle") return null;

  return (
    <>
      <div
        style={{
          position: "fixed", top: 0, left: 0, right: 0, height: "3px", zIndex: 9999,
          background: "linear-gradient(90deg, #1D4ED8, #3B82F6)",
          animation: status === "loading" ? "nav-loading 8s ease-out forwards" : "nav-done 0.25s ease-out forwards",
        }}
      />
      <style>{`
        @keyframes nav-loading { from { width: 0% } to { width: 85% } }
        @keyframes nav-done    { from { width: 85% } to { width: 100%; opacity: 0 } }
      `}</style>
    </>
  );
}

const pathTitles: Record<string, string> = {
  "/dashboard":              "Vue d'ensemble",
  "/dashboard/projects":     "Projets",
  "/dashboard/projects/new": "Nouveau projet",
  "/dashboard/clients":      "Clients",
  "/dashboard/messages":     "Messages",
  "/dashboard/analytics":    "Analytics",
  "/dashboard/settings":     "Parametres",
};

function getPageTitle(pathname: string): string {
  if (pathname.includes("/edit")) return "Modifier le projet";
  if (/\/dashboard\/clients\/[^/]+$/.test(pathname)) return "Fiche client";
  return pathTitles[pathname] ?? "Dashboard";
}

type HeaderNotification = {
  id: string; title: string; message: string | null;
  read: boolean; resourceType: string | null; createdAt: string;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [liveNotifToast, setLiveNotifToast] = useState<string>("");
  const [accountProfile, setAccountProfile] = useState<{ name: string; avatarUrl: string | null } | null>(null);
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { account?: { profile?: { name?: string; avatarUrl?: string | null } } };
        if (!mounted || !data.account?.profile) return;
        setAccountProfile({ name: data.account.profile.name ?? "Max HGD", avatarUrl: data.account.profile.avatarUrl ?? null });
      } catch {}
    };
    void load();
    window.addEventListener("account-profile-updated", () => void load());
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    let previousUnread = 0;
    const load = async () => {
      try {
        const res = await fetch("/api/notifications?limit=6", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { notifications?: HeaderNotification[]; unreadCount?: number };
        if (!mounted) return;
        const nextNotifications = Array.isArray(data.notifications) ? data.notifications : [];
        const nextUnread = typeof data.unreadCount === "number" ? data.unreadCount : 0;

        if (nextUnread > previousUnread && nextNotifications.length > 0) {
          setLiveNotifToast(nextNotifications[0].title || "Nouvelle notification");
          window.setTimeout(() => setLiveNotifToast(""), 2600);
        }

        previousUnread = nextUnread;
        setNotifications(nextNotifications);
        setUnreadNotifCount(nextUnread);
      } catch {}
    };
    void load();
    const id = window.setInterval(() => void load(), 30000);
    return () => { mounted = false; window.clearInterval(id); };
  }, []);

  async function handleMarkAllRead() {
    try {
      const res = await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "markAllRead" }) });
      if (!res.ok) return;
      setNotifications(p => p.map(n => ({ ...n, read: true })));
      setUnreadNotifCount(0);
      setNotifOpen(false);
    } catch {}
  }

  const displayName = accountProfile?.name ?? "Max HGD";
  const avatarUrl = accountProfile?.avatarUrl ?? null;

  return (
    <div className="dashboard-scope min-h-screen" style={{ background: "var(--d-bg)", transition: "background 0.25s ease, color 0.25s ease" }}>
      <NavigationBar />

      {liveNotifToast ? (
        <div className="fixed right-6 top-18 z-50 rounded-xl border border-blue-100 bg-white px-4 py-3 shadow-lg animate-fade-in dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-700 dark:text-blue-300">Notification</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{liveNotifToast}</p>
        </div>
      ) : null}

      {/* Overlay mobile */}
      <div
        className={["fixed inset-0 z-30 lg:hidden transition-opacity duration-200", sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"].join(" ")}
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div className={["fixed left-0 top-0 h-full z-40 transition-transform duration-300 lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full"].join(" ")}>
        <Sidebar />
      </div>

      {/* Main */}
      <div className="lg:ml-[220px] flex flex-col min-h-screen">

        {/* Header */}
        <header
          className="sticky top-0 z-20 flex items-center gap-3 px-4 backdrop-blur-md relative"
          style={{ height: "52px", background: "var(--d-header)", borderBottom: "1px solid var(--d-border)" }}
        >
          {/* Burger */}
          <button type="button" className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg transition-colors" style={{ color: "var(--d-icon)" }} onClick={() => setSidebarOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Titre */}
          <div className="flex items-center gap-2">
            <span
              className="hidden md:inline-flex text-[11px] font-semibold uppercase tracking-[0.12em] px-2 py-1 rounded-full"
              style={{ color: "var(--d-badge-c)", background: "var(--d-badge-bg)" }}
            >
              Console
            </span>
            <h1 className="text-sm font-semibold" style={{ color: "var(--d-t1)" }}>{pageTitle}</h1>
          </div>

          <div className="flex-1" />

          {/* Recherche */}
          <div className="hidden sm:block">
            <div className="relative">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--d-t4)" }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Rechercher..."
                className="outline-none text-xs transition-all"
                style={{ width: "180px", paddingLeft: "28px", paddingRight: "10px", paddingTop: "5px", paddingBottom: "5px", background: "var(--d-input)", border: "1px solid transparent", borderRadius: "9999px", color: "var(--d-t1)" }}
                onFocus={e => { e.currentTarget.style.borderColor = "#1D4ED8"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "transparent"; }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">

            {/* Toggle dark/light */}
            <button
              type="button"
              onClick={toggle}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--d-icon)" }}
            >
              {theme === "dark" ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {/* Notif */}
            <button type="button" onClick={() => setNotifOpen(s => !s)} aria-expanded={notifOpen} aria-label="Notifications" className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors" style={{ color: "var(--d-icon)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadNotifCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full border-2 animate-pulse" style={{ background: "#EF4444", borderColor: "var(--d-header)" }} />}
            </button>

            {notifOpen && (
              <div className="absolute right-6 top-14 w-72 rounded-xl shadow-xl p-3 z-30" style={{ background: "var(--d-card)", border: "1px solid var(--d-border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--d-t3)" }}>Notifications</p>
                <div className="mt-2 flex flex-col gap-1">
                  {notifications.length === 0 ? (
                    <p className="text-sm px-2.5 py-2 rounded-lg" style={{ color: "var(--d-t3)" }}>Aucune notification récente.</p>
                  ) : notifications.map(n => (
                    <a key={n.id} href={n.resourceType === "message" ? "/dashboard/messages" : "/dashboard"} className="text-sm rounded-lg px-2.5 py-2 transition-colors" style={{ color: n.read ? "var(--d-t3)" : "var(--d-t1)", fontWeight: n.read ? 500 : 600 }}>
                      {n.title}
                    </a>
                  ))}
                </div>
                <button type="button" className="mt-3 w-full text-xs font-semibold rounded-lg px-3 py-2 transition-colors" style={{ background: "var(--d-input)", color: "var(--d-t2)" }} onClick={handleMarkAllRead}>
                  Marquer comme lues
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-4" style={{ background: "var(--d-sep)" }} />

          {/* Avatar */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden text-white text-[10px] font-bold" style={{ background: "#1D4ED8" }}>
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> : displayName.slice(0, 2).toUpperCase()}
            </div>
            <span className="hidden md:block text-sm font-medium" style={{ color: "var(--d-t2)" }}>{displayName}</span>
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1 p-4 lg:p-5">{children}</main>
      </div>
    </div>
  );
}
