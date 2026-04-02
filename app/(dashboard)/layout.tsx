"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

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
          animation: status === "loading"
            ? "nav-loading 8s ease-out forwards"
            : "nav-done 0.25s ease-out forwards",
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
  "/dashboard":           "Vue d'ensemble",
  "/dashboard/projects":  "Projets",
  "/dashboard/projects/new": "Nouveau projet",
  "/dashboard/clients":   "Clients",
  "/dashboard/messages":  "Messages",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings":  "Parametres",
};

function getPageTitle(pathname: string): string {
  if (pathname.includes("/edit")) return "Modifier le projet";
  if (/\/dashboard\/clients\/[^/]+$/.test(pathname)) return "Fiche client";
  return pathTitles[pathname] ?? "Dashboard";
}

type HeaderNotification = {
  id: string;
  title: string;
  message: string | null;
  read: boolean;
  resourceType: string | null;
  createdAt: string;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [accountProfile, setAccountProfile] = useState<{
    name: string;
    avatarUrl: string | null;
  } | null>(null);
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

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
              avatarUrl?: string | null;
            };
          };
        };

        if (!mounted || !data.account?.profile) return;

        setAccountProfile({
          name: data.account.profile.name ?? "Max HGD",
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

  const displayName = accountProfile?.name ?? "Max HGD";
  const avatarUrl = accountProfile?.avatarUrl ?? null;

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/notifications?limit=6", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as {
          notifications?: HeaderNotification[];
          unreadCount?: number;
        };

        if (!mounted) return;
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setUnreadNotifCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
      } catch {
        // Ignore temporary network errors.
      }
    };

    void loadNotifications();
    const intervalId = window.setInterval(() => void loadNotifications(), 30000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  async function handleMarkNotificationsAsRead() {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });

      if (!response.ok) return;

      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadNotifCount(0);
      setNotifOpen(false);
    } catch {
      // Ignore temporary network errors.
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#F3F4F6" }}>
      <NavigationBar />

      {/* Overlay mobile */}
      <div
        className={[
          "fixed inset-0 z-30 lg:hidden transition-opacity duration-200",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className={[
          "fixed left-0 top-0 h-full z-40 transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <Sidebar />
      </div>

      {/* Main */}
      <div className="lg:ml-[260px] flex flex-col min-h-screen">

        {/* Header */}
        <header
          className="sticky top-0 z-20 flex items-center gap-4 px-6 bg-white/95 backdrop-blur relative"
          style={{ height: "64px" }}
        >
          {/* Burger mobile */}
          <button
            type="button"
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
            style={{ color: "#64748B" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Titre page */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex text-[11px] font-semibold uppercase tracking-[0.12em] px-2 py-1 rounded-full" style={{ color: "#1E40AF", background: "#DBEAFE" }}>
              Console
            </span>
            <h1 className="text-sm font-semibold" style={{ color: "#0F172A" }}>{pageTitle}</h1>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Recherche */}
          <div className="hidden sm:block">
            <div className="relative">
              <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#9CA3AF" }}
              >
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Rechercher..."
                className="outline-none text-sm transition-all"
                style={{
                  width: "220px",
                  paddingLeft: "32px",
                  paddingRight: "12px",
                  paddingTop: "7px",
                  paddingBottom: "7px",
                  background: "#F1F5F9",
                  border: "1px solid transparent",
                  borderRadius: "9999px",
                  color: "#0F172A",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = "#FFFFFF";
                  e.currentTarget.style.borderColor = "#1D4ED8";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = "#F1F5F9";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Notif */}
            <button
              type="button"
              onClick={() => setNotifOpen((s) => !s)}
              aria-expanded={notifOpen}
              aria-label="Notifications"
              className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
              style={{ color: "#64748B" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full border-2 border-white" style={{ background: "#EF4444" }} />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-6 top-14 w-72 rounded-xl border border-neutral-200 bg-white shadow-lg p-3 z-30">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>Notifications</p>
                <div className="mt-2 flex flex-col gap-2">
                  {notifications.length === 0 ? (
                    <p className="text-sm rounded-lg px-2.5 py-2" style={{ color: "#64748B" }}>
                      Aucune notification recente.
                    </p>
                  ) : (
                    notifications.map((item) => (
                      <a
                        key={item.id}
                        href={item.resourceType === "message" ? "/dashboard/messages" : "/dashboard"}
                        className="text-sm rounded-lg px-2.5 py-2 hover:bg-slate-50"
                        style={{ color: item.read ? "#64748B" : "#0F172A", fontWeight: item.read ? 500 : 600 }}
                      >
                        {item.title}
                      </a>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  className="mt-3 w-full text-xs font-semibold rounded-lg px-3 py-2"
                  style={{ background: "#EFF6FF", color: "#1E40AF" }}
                  onClick={handleMarkNotificationsAsRead}
                >
                  Marquer comme lues
                </button>
              </div>
            )}
          </div>

          {/* Séparateur */}
          <div className="w-px h-4" style={{ background: "#E2E8F0" }} />

          {/* Avatar */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden text-white text-[10px] font-bold"
              style={{ background: "#1D4ED8" }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar administrateur" className="h-full w-full object-cover" />
              ) : (
                displayName.slice(0, 2).toUpperCase()
              )}
            </div>
            <span className="hidden md:block text-sm font-medium" style={{ color: "#334155" }}>{displayName}</span>
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1 p-6 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
