"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Section = "profile" | "security" | "preferences" | "danger";

type StableSnapshot = {
  profileForm: {
    name: string;
    email: string;
    bio: string;
    site: string;
    location: string;
    phone: string;
  };
  prefs: {
    emailNotifications: boolean;
    projectUpdates: boolean;
    weeklyReport: boolean;
    messageAlerts: boolean;
  };
  avatarFileName: string;
  activeSection: Section;
};

type PlatformVersion = {
  id: string;
  name: string;
  savedAt: string;
  isActive: boolean;
  account: {
    profile: {
      name: string;
      email: string;
      bio: string;
      site: string;
      location: string;
      avatarUrl?: string | null;
    };
    preferences: {
      emailNotifications: boolean;
      projectUpdates: boolean;
      weeklyReport: boolean;
      language: string;
    };
    passwordUpdatedAt: string | null;
    deleted: boolean;
  };
  uiState: StableSnapshot | null;
};

const APPLIED_DEPLOYMENT_VERSION_KEY = "admin-applied-deployment-version";

const inputStyle: React.CSSProperties = {
  background: "#F8FAFC",
  border: "1.5px solid #DBEAFE",
  borderRadius: "8px",
  color: "#0F172A",
  fontSize: "14px",
  outline: "none",
  padding: "10px 14px",
  width: "100%",
  transition: "all 0.2s ease",
};

function useInputFocus() {
  return {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.currentTarget.style.background = "#FFFFFF";
      e.currentTarget.style.borderColor = "#3B82F6";
      e.currentTarget.style.boxShadow = "none";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.currentTarget.style.background = "#F8FAFC";
      e.currentTarget.style.borderColor = "#DBEAFE";
      e.currentTarget.style.boxShadow = "none";
    },
  };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold tracking-tight text-blue-700">{children}</h3>;
}

function SettingCard({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-2xl border border-blue-100 bg-white ${className}`} style={style}>
      {children}
    </div>
  );
}

function PrimaryButton({ label = "Sauvegarder", onClick, disabled = false }: { label?: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [avatarFileName, setAvatarFileName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [stableSavedAt, setStableSavedAt] = useState<string | null>(null);
  const [versionHistory, setVersionHistory] = useState<PlatformVersion[]>([]);
  const [latestDeploymentVersion, setLatestDeploymentVersion] = useState<string | null>(null);
  const [appliedDeploymentVersion, setAppliedDeploymentVersion] = useState<string | null>(null);
  const [hasDeploymentUpdate, setHasDeploymentUpdate] = useState(false);
  const focus = useInputFocus();

  const [profileForm, setProfileForm] = useState({
    name: "Max HGD",
    email: "admin@maxhgd.com",
    bio: "Designer et developpeur freelance. Specialise en UX/UI et frontend.",
    site: "https://maxhgd.com",
    location: "Paris, France",
    phone: "+33 6 00 00 00 00",
  });

  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [notificationEmail, setNotificationEmail] = useState("");
  const [savedNotificationEmail, setSavedNotificationEmail] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    projectUpdates: false,
    weeklyReport: true,
    messageAlerts: true,
    language: "fr",
  });

  function flash(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 2500);
  }

  async function loadVersionHistory() {
    try {
      const response = await fetch("/api/settings?action=versions");
      if (!response.ok) return;
      const data = (await response.json()) as { versions?: PlatformVersion[] };
      const versions = Array.isArray(data.versions) ? data.versions : [];
      setVersionHistory(versions);
      const activeVersion = versions.find((version) => version.isActive);
      setStableSavedAt(activeVersion?.savedAt ?? versions[0]?.savedAt ?? null);
    } catch {
      // Ignore temporary network errors.
    }
  }

  async function loadDeploymentStatus() {
    try {
      const response = await fetch("/api/settings?action=deploymentStatus", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { latestDeploymentVersion?: string };
      if (!data.latestDeploymentVersion) return;

      setLatestDeploymentVersion(data.latestDeploymentVersion);

      const storedAppliedVersion = window.localStorage.getItem(APPLIED_DEPLOYMENT_VERSION_KEY);
      if (!storedAppliedVersion) {
        window.localStorage.setItem(APPLIED_DEPLOYMENT_VERSION_KEY, data.latestDeploymentVersion);
        setAppliedDeploymentVersion(data.latestDeploymentVersion);
        setHasDeploymentUpdate(false);
        return;
      }

      setAppliedDeploymentVersion(storedAppliedVersion);
      setHasDeploymentUpdate(storedAppliedVersion !== data.latestDeploymentVersion);
    } catch {
      // Ignore temporary network errors.
    }
  }

  async function loadNotificationEmail() {
    try {
      const response = await fetch("/api/notification-email", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { notificationEmail?: string };
      const value = data.notificationEmail ?? "";
      setNotificationEmail(value);
      setSavedNotificationEmail(value);
    } catch {
      // Ignore temporary network errors.
    }
  }

  async function loadAccount() {
    try {
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as {
        account?: {
          profile?: {
            name?: string;
            email?: string;
            bio?: string;
            site?: string;
            location?: string;
            avatarUrl?: string | null;
          };
          preferences?: {
            emailNotifications?: boolean;
            projectUpdates?: boolean;
            weeklyReport?: boolean;
            language?: string;
          };
        };
      };

      if (data.account?.profile) {
        setProfileForm((prev) => ({
          ...prev,
          name: data.account?.profile?.name ?? prev.name,
          email: data.account?.profile?.email ?? prev.email,
          bio: data.account?.profile?.bio ?? prev.bio,
          site: data.account?.profile?.site ?? prev.site,
          location: data.account?.profile?.location ?? prev.location,
        }));
        setAvatarUrl(data.account.profile.avatarUrl ?? null);
      }

      if (data.account?.preferences) {
        setPrefs((prev) => ({
          ...prev,
          emailNotifications: data.account?.preferences?.emailNotifications ?? prev.emailNotifications,
          projectUpdates: data.account?.preferences?.projectUpdates ?? prev.projectUpdates,
          weeklyReport: data.account?.preferences?.weeklyReport ?? prev.weeklyReport,
          language: data.account?.preferences?.language ?? prev.language,
        }));
      }
    } catch {
      // Ignore temporary network errors.
    }
  }

  useEffect(() => {
    void loadAccount();
    void loadNotificationEmail();
    void loadVersionHistory();
    void loadDeploymentStatus();
  }, []);

  function buildSnapshot(): StableSnapshot {
    return {
      profileForm,
      prefs,
      avatarFileName,
      activeSection,
    };
  }

  async function saveUiVersion({ silent = false, makeActive = true }: { silent?: boolean; makeActive?: boolean } = {}) {
    try {
      const snapshot = buildSnapshot();
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createVersion", uiState: snapshot, makeActive }),
      });
      if (!response.ok) {
        if (!silent) {
          flash("error", "Impossible d'enregistrer la version plateforme.");
        }
        return;
      }

      await loadVersionHistory();
      if (!silent) {
        flash("success", "Nouvelle version front+back enregistree.");
      }
    } catch {
      if (!silent) {
        flash("error", "Impossible d'enregistrer la version plateforme.");
      }
    }
  }

  async function applyLatestDeployment() {
    if (!latestDeploymentVersion) {
      flash("error", "Version distante indisponible pour le moment.");
      return;
    }

    await saveUiVersion({ silent: true, makeActive: false });
    window.localStorage.setItem(APPLIED_DEPLOYMENT_VERSION_KEY, latestDeploymentVersion);
    setAppliedDeploymentVersion(latestDeploymentVersion);
    setHasDeploymentUpdate(false);
    flash("success", "Mise a jour appliquee. Rechargement...");
    setTimeout(() => window.location.reload(), 700);
  }

  function applyUiSnapshot(snapshot: StableSnapshot | null, fallbackSection: Section = "profile") {
    if (!snapshot) {
      setActiveSection(fallbackSection);
      return;
    }
    setProfileForm(snapshot.profileForm);
    setPrefs(snapshot.prefs);
    setAvatarFileName(snapshot.avatarFileName ?? "");
    setActiveSection(snapshot.activeSection ?? fallbackSection);
  }

  async function restoreStableSnapshot() {
    if (!versionHistory.length) {
      flash("error", "Aucune version stable disponible.");
      return;
    }
    await restoreVersionById(versionHistory[0].id);
  }

  async function restoreVersionById(versionId: string) {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restoreVersion", versionId }),
      });
      if (!response.ok) {
        flash("error", "Version selectionnee introuvable.");
        return;
      }

      const data = (await response.json()) as { version?: PlatformVersion };
      if (!data.version) {
        flash("error", "Version selectionnee introuvable.");
        return;
      }

      applyUiSnapshot(data.version.uiState, "profile");
      setAvatarUrl(data.version.account.profile.avatarUrl ?? null);
      setStableSavedAt(data.version.savedAt);
      await loadVersionHistory();
      window.dispatchEvent(new Event("account-profile-updated"));
      flash("success", "Version front+back appliquee.");
    } catch {
      flash("error", "Impossible de restaurer la version selectionnee.");
    }
  }

  async function handleProfileSave() {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      flash("error", "Le nom et l'email sont requis.");
      return;
    }

    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "saveProfile", profile: profileForm }),
    });

    if (!response.ok) {
      flash("error", "Echec de la sauvegarde du profil.");
      return;
    }

    window.dispatchEvent(new Event("account-profile-updated"));
    flash("success", "Profil sauvegarde avec succes.");
  }

  async function handlePasswordUpdate() {
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      flash("error", "Veuillez remplir tous les champs mot de passe.");
      return;
    }
    if (passwordForm.next.length < 8) {
      flash("error", "Le nouveau mot de passe doit contenir au moins 8 caracteres.");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      flash("error", "La confirmation du mot de passe ne correspond pas.");
      return;
    }

    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updatePassword", password: passwordForm }),
    });

    if (!response.ok) {
      flash("error", "Impossible de mettre a jour le mot de passe.");
      return;
    }

    setPasswordForm({ current: "", next: "", confirm: "" });
    flash("success", "Mot de passe mis a jour.");
  }

  async function handleNotificationEmailSave() {
    setIsSavingEmail(true);
    try {
      const emailToSave = notificationEmail.trim();
      const response = await fetch("/api/notification-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationEmail: emailToSave }),
      });

      if (!response.ok) {
        flash("error", "Echec de la sauvegarde de l'email de notification.");
        return;
      }

      // Re-fetch depuis le serveur pour confirmer et synchroniser l'etat
      const confirmResponse = await fetch("/api/notification-email", { cache: "no-store" });
      if (confirmResponse.ok) {
        const data = (await confirmResponse.json()) as { notificationEmail?: string };
        const confirmed = data.notificationEmail ?? "";
        setNotificationEmail(confirmed);
        setSavedNotificationEmail(confirmed);
      } else {
        setSavedNotificationEmail(emailToSave);
        setNotificationEmail(emailToSave);
      }

      flash("success", "Email de notification enregistre.");
    } catch {
      flash("error", "Erreur reseau lors de la sauvegarde.");
    } finally {
      setIsSavingEmail(false);
    }
  }

  async function handlePreferencesSave() {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "savePreferences", preferences: prefs }),
    });

    if (!response.ok) {
      flash("error", "Echec de la sauvegarde des preferences.");
      return;
    }

    flash("success", "Preferences enregistrees.");
  }

  async function handleAvatarInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      flash("error", "Format invalide. Utilisez JPG ou PNG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      flash("error", "Image trop lourde. Maximum 2 MB.");
      return;
    }

    const toDataUrl = (inputFile: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
            return;
          }
          reject(new Error("Lecture image impossible"));
        };
        reader.onerror = () => reject(new Error("Lecture image impossible"));
        reader.readAsDataURL(inputFile);
      });

    try {
      const nextAvatarUrl = await toDataUrl(file);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveAvatar", avatarUrl: nextAvatarUrl }),
      });

      if (!response.ok) {
        flash("error", "Impossible de sauvegarder la photo de profil.");
        return;
      }

      setAvatarFileName(file.name);
      setAvatarUrl(nextAvatarUrl);
      window.dispatchEvent(new Event("account-profile-updated"));
      flash("success", "Photo de profil mise a jour partout.");
    } catch {
      flash("error", "Impossible de traiter cette image.");
    }
  }

  async function handleExportData() {
    const response = await fetch("/api/settings?action=export");
    if (!response.ok) {
      flash("error", "Export impossible.");
      return;
    }

    const payload = await response.json();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "account-export.json";
    a.click();
    URL.revokeObjectURL(url);
    flash("success", "Export termine.");
  }

  async function handleDeleteAccount() {
    const ok = window.confirm("Confirmer la suppression du compte ? Cette action est irreversible.");
    if (!ok) return;

    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteAccount" }),
    });

    if (!response.ok) {
      flash("error", "Echec de la suppression du compte.");
      return;
    }

    flash("success", "Compte supprime.");
    setTimeout(() => router.push("/"), 500);
  }

  const sections: Array<{ id: Section; label: string }> = [
    { id: "profile", label: "Profil" },
    { id: "security", label: "Securite" },
    { id: "preferences", label: "Preferences" },
    { id: "danger", label: "Zone danger" },
  ];

  const completionChecks = [
    profileForm.name.trim().length > 0,
    profileForm.email.trim().length > 0,
    profileForm.bio.trim().length > 0,
    profileForm.site.trim().length > 0,
    profileForm.location.trim().length > 0,
  ];
  const completionPercent = Math.round((completionChecks.filter(Boolean).length / completionChecks.length) * 100);
  const activeNotifications = [prefs.emailNotifications, prefs.projectUpdates, prefs.weeklyReport, prefs.messageAlerts].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-5" style={{ animation: "fadeSlideUp 260ms ease-out both" }}>
      <div className="rounded-[26px] border border-blue-100 bg-blue-50 p-4 sm:p-5 lg:p-6" style={{ animation: "fadeSlideUp 320ms ease-out both" }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Account center</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Parametres administrateur</h2>
            <p className="mt-1 text-sm text-slate-600">Gerez votre compte, votre securite et vos preferences.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-blue-600 text-sm font-semibold text-white">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                (profileForm.name || "MH").slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">{profileForm.name}</p>
              <p className="text-[11px] text-slate-500">{profileForm.email}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">Completion</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">{completionPercent}%</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">Notifications</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">{activeNotifications} active(s)</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 col-span-2 sm:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">Sections</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">{sections.length}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={handleExportData} className="inline-flex items-center rounded-lg border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-50">
            Exporter
          </button>
        </div>

        {stableSavedAt && (
          <p className="mt-2 text-xs text-slate-500">
            Version stable: {new Date(stableSavedAt).toLocaleString("fr-FR")}
          </p>
        )}
      </div>

      {feedback && (
        <div className="rounded-xl border px-4 py-3 text-sm font-medium" style={feedback.type === "success" ? { background: "#ECFDF5", color: "#065F46", borderColor: "#A7F3D0" } : { background: "#FEF2F2", color: "#7F1D1D", borderColor: "#FCA5A5" }}>
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4" style={{ animation: "fadeSlideUp 520ms ease-out both" }}>
        <div className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-5">
          <div className="rounded-xl border border-blue-100 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Navigation des sections</p>
              <span className="inline-flex h-6 items-center rounded-full border border-blue-100 bg-blue-50 px-2 text-[11px] font-semibold text-blue-700">
                {sections.find((section) => section.id === activeSection)?.label}
              </span>
            </div>
            <div className="inline-flex w-full gap-2 rounded-lg border border-blue-100 bg-slate-50 p-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={[
                    "inline-flex flex-1 items-center justify-center rounded-md px-2 py-2 text-xs font-semibold transition",
                    activeSection === section.id ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                  ].join(" ")}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {activeSection === "profile" && (
              <>
                <SettingCard className="p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-lg font-bold text-blue-700">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Photo de profil" className="h-full w-full object-cover" />
                        ) : (
                          (profileForm.name || "MH").slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <SectionTitle>Photo de profil</SectionTitle>
                        <p className="text-xs mt-0.5 text-slate-400">{avatarFileName ? `Fichier: ${avatarFileName}` : "JPG, PNG. 2 MB max."}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                      Changer
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleAvatarInputChange} />
                  </div>
                </SettingCard>

                <SettingCard className="p-5 sm:p-6 space-y-4">
                  <SectionTitle>Informations personnelles</SectionTitle>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-slate-900">Nom complet</label><input type="text" value={profileForm.name} onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} {...focus} /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-slate-900">Email</label><input type="email" value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} style={inputStyle} {...focus} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-slate-900">Site web</label><input type="url" value={profileForm.site} onChange={(e) => setProfileForm((p) => ({ ...p, site: e.target.value }))} style={inputStyle} {...focus} /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-slate-900">Telephone</label><input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} style={inputStyle} {...focus} /></div>
                  </div>
                  <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-slate-900">Localisation</label><input type="text" value={profileForm.location} onChange={(e) => setProfileForm((p) => ({ ...p, location: e.target.value }))} style={inputStyle} {...focus} /></div>
                  <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-slate-900">Bio</label><textarea value={profileForm.bio} onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))} rows={3} style={{ ...inputStyle, resize: "none" }} {...focus} /></div>
                  <div className="flex justify-end border-t border-blue-100 pt-3"><PrimaryButton label="Sauvegarder" onClick={handleProfileSave} /></div>
                </SettingCard>
              </>
            )}

            {activeSection === "security" && (
              <SettingCard className="p-5 sm:p-6 space-y-4">
                <SectionTitle>Mot de passe</SectionTitle>
                <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-slate-900">Mot de passe actuel</label><input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))} style={inputStyle} {...focus} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-slate-900">Nouveau mot de passe</label><input type="password" value={passwordForm.next} onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))} style={inputStyle} {...focus} /></div>
                  <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-slate-900">Confirmer</label><input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} style={inputStyle} {...focus} /></div>
                </div>
                <div className="flex justify-end border-t border-blue-100 pt-3"><PrimaryButton label="Mettre a jour" onClick={handlePasswordUpdate} /></div>
              </SettingCard>
            )}

            {activeSection === "preferences" && (
              <>
                <SettingCard className="p-5 sm:p-6 space-y-3">
                  <SectionTitle>Notifications</SectionTitle>
                  {[
                    { key: "emailNotifications", label: "Emails de messages", desc: "Nouveaux messages clients" },
                    { key: "projectUpdates", label: "Mises a jour projets", desc: "Changements de statut" },
                    { key: "messageAlerts", label: "Alertes instantanees", desc: "Messages urgents" },
                    { key: "weeklyReport", label: "Rapport hebdomadaire", desc: "Resume chaque lundi" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border border-blue-100 bg-slate-50 px-3 py-3">
                      <div><p className="text-sm font-medium text-slate-900">{label}</p><p className="text-xs text-slate-500">{desc}</p></div>
                      <label className="relative cursor-pointer">
                        <input type="checkbox" checked={prefs[key as keyof typeof prefs] as boolean} onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))} className="sr-only" />
                        <div className="h-6 w-10 rounded-xl transition-colors duration-200" style={{ background: (prefs[key as keyof typeof prefs] as boolean) ? "#3B82F6" : "#CBD5E1" }} />
                        <div className="absolute left-1 top-1 h-4 w-4 rounded-lg bg-white transition-transform duration-200" style={{ transform: (prefs[key as keyof typeof prefs] as boolean) ? "translateX(16px)" : "translateX(0)" }} />
                      </label>
                    </div>
                  ))}
                  <div className="pt-1">
                    <p className="text-sm font-medium text-slate-900 mb-1">Email de notification</p>
                    <input
                      type="email"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      placeholder="contact@votresite.com"
                      style={inputStyle}
                      {...focus}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Les messages du formulaire de contact seront envoyes a cette adresse
                    </p>
                    <div className="flex justify-end pt-2">
                      <PrimaryButton
                        label={isSavingEmail ? "Enregistrement..." : "Enregistrer"}
                        onClick={() => void handleNotificationEmailSave()}
                        disabled={isSavingEmail || notificationEmail.trim() === savedNotificationEmail.trim()}
                      />
                    </div>
                  </div>
                </SettingCard>

                <SettingCard className="p-5 sm:p-6 space-y-3">
                  <SectionTitle>Langue de l'interface</SectionTitle>
                  <select
                    value={prefs.language}
                    onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
                    className="h-10 rounded-lg border border-blue-100 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
                  >
                    <option value="fr">Francais</option>
                    <option value="en">English</option>
                    <option value="es">Espanol</option>
                    <option value="de">Deutsch</option>
                  </select>
                  <div className="flex justify-end border-t border-blue-100 pt-3"><PrimaryButton label="Enregistrer" onClick={handlePreferencesSave} /></div>
                </SettingCard>
              </>
            )}

            {activeSection === "danger" && (
              <SettingCard className="p-5 sm:p-6 space-y-3" style={{ borderColor: "#FECACA" }}>
                <SectionTitle>Zone dangereuse</SectionTitle>
                <p className="text-xs text-red-700">Ces actions sont definitives et irreversibles.</p>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-slate-50 p-3">
                    <div><p className="text-sm font-medium text-slate-900">Exporter les donnees</p><p className="text-xs text-slate-500">Telecharger vos donnees en JSON</p></div>
                    <button type="button" onClick={handleExportData} className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50">Exporter</button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3">
                    <div><p className="text-sm font-medium text-red-900">Supprimer le compte</p><p className="text-xs text-red-700">Suppression definitive de toutes les donnees</p></div>
                    <button type="button" onClick={handleDeleteAccount} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700">Supprimer</button>
                  </div>
                </div>
              </SettingCard>
            )}
          </div>
        </div>
      </div>

      <SettingCard className="p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle>Mises a jour plateforme</SectionTitle>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyLatestDeployment}
              disabled={!hasDeploymentUpdate}
              className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-55"
            >
              Mettre a jour
            </button>
            <button
              type="button"
              onClick={restoreStableSnapshot}
              className="inline-flex items-center rounded-lg border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-50"
            >
              Restaurer la plus recente
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">
            {hasDeploymentUpdate ? "Une nouvelle version vous attend" : "Aucune nouvelle version disponible"}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Version appliquee: {appliedDeploymentVersion ?? "inconnue"}
          </p>
          <p className="text-xs text-slate-600">
            Version disponible: {latestDeploymentVersion ?? "inconnue"}
          </p>
        </div>

        <p className="text-xs text-slate-500">
          Lors d'une mise a jour, votre etat front+back est sauvegarde automatiquement. Vous pouvez ensuite revenir sur une ancienne version qui vous convenait.
        </p>

        <div className="max-h-56 overflow-y-auto rounded-xl border border-blue-100 bg-slate-50 p-2">
          {versionHistory.length === 0 ? (
            <p className="px-2 py-2 text-sm text-slate-500">Aucune version enregistree pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {versionHistory.map((version) => (
                <div key={version.id} className="flex items-center justify-between rounded-lg border border-blue-100 bg-white px-3 py-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{version.name}</p>
                      {version.isActive && (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                          Version active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{new Date(version.savedAt).toLocaleString("fr-FR")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => restoreVersionById(version.id)}
                    className="rounded-lg border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    Appliquer cette version
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SettingCard>
    </div>
  );
}
