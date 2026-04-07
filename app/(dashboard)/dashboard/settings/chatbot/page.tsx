"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Cpu, Save, Plus, Trash2, Loader2, Send, Sparkles, Settings, Users, HelpCircle, MessageSquare, BarChart3, Link as LinkIcon, Edit, Check, Eye, User } from "lucide-react";
import { toast } from "sonner";

interface QuickAction {
  label: string;
  message: string;
  url?: string;
}

interface ChatbotService {
  id: string;
  name: string;
  description?: string;
  priceRange?: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  username?: string;
  isActive: boolean;
  order: number;
}

interface ChatbotFAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order: number;
  isActive: boolean;
}

interface ChatbotMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  conversationId: string;
}

interface ChatbotConversation {
  id: string;
  sessionId: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  visitorPhone?: string | null;
  notes?: string | null;
  status: string;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
  messages: ChatbotMessage[];
  _count: { messages: number };
}

interface ChatbotStats {
  totalConversations: number;
  conversationsThisMonth: number;
  conversationsThisWeek: number;
  totalMessages: number;
  activeConversations: number;
  needsFollowup: number;
  topThemes: Array<{ theme: string; count: number }>;
}

interface ChatbotSettingsData {
  chatbotEnabled: boolean;
  chatbotUseAI: boolean;
  chatbotWelcome: string;
  chatbotPersonality: string;
  chatbotPrimaryColor: string;
  chatbotQuickActions: QuickAction[];
  publicName?: string;
  publicTitle?: string;
  publicEmail?: string;
  publicPhone?: string;
  publicLocation?: string;
  publicAvailability?: string;
}

const personalities = [
  { value: "friendly", label: "Amical", description: "Ton chaleureux et accessible" },
  { value: "professional", label: "Professionnel", description: "Ton formel et serieux" },
  { value: "casual", label: "Decontracte", description: "Ton leger et moderne" },
  { value: "technical", label: "Technique", description: "Ton precis et detaille" },
];


function ToggleSwitch({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={`${label}: ${checked ? "ON" : "OFF"}`}
      aria-checked={checked}
      onClick={onToggle}
      className="relative inline-flex h-11 min-w-[88px] items-center rounded-full border px-1 transition-colors"
      style={{
        borderColor: checked ? "var(--ui-primary)" : "var(--ui-border)",
        background: checked ? "var(--ui-primary-soft)" : "var(--ui-input-bg)",
      }}
    >
      <span
        className="inline-flex h-8 w-[44px] items-center justify-center rounded-full text-[10px] font-bold text-white transition-transform"
        style={{
          transform: checked ? "translateX(38px)" : "translateX(0)",
          background: checked ? "var(--ui-primary)" : "#94A3B8",
        }}
      >
        {checked ? "ON" : "OFF"}
      </span>
    </button>
  );
}
const socialPlatforms = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "github", label: "GitHub" },
  { value: "twitter", label: "Twitter / X" },
  { value: "dribbble", label: "Dribbble" },
  { value: "behance", label: "Behance" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "pinterest", label: "Pinterest" },
  { value: "snapchat", label: "Snapchat" },
  { value: "discord", label: "Discord" },
  { value: "slack", label: "Slack" },
  { value: "medium", label: "Medium" },
  { value: "devto", label: "Dev.to" },
  { value: "codepen", label: "CodePen" },
  { value: "figma", label: "Figma Community" },
  { value: "notion", label: "Notion" },
  { value: "linktree", label: "Linktree" },
  { value: "calendly", label: "Calendly" },
  { value: "upwork", label: "Upwork" },
  { value: "fiverr", label: "Fiverr" },
  { value: "malt", label: "Malt" },
  { value: "website", label: "Site web personnel" },
];

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const safe = /^[0-9a-fA-F]{6}$/.test(clean) ? clean : "3B82F6";
  const r = Number.parseInt(safe.slice(0, 2), 16);
  const g = Number.parseInt(safe.slice(2, 4), 16);
  const b = Number.parseInt(safe.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ChatbotPreview({ settings }: { settings: ChatbotSettingsData }) {
  const quickActions = settings.chatbotQuickActions
    .filter((a) => a.label.trim().length > 0)
    .slice(0, 3);

  return (
    <div className="sticky top-24 max-w-[340px]">
      <Card className="overflow-hidden rounded-[22px] border border-slate-200/70 bg-white text-slate-900 shadow-[0_20px_38px_rgba(37,99,235,0.12)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
            <Sparkles className="h-4 w-4 text-blue-300" />
            Previsualisation live
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500">
            Apercu du rendu final avec vos reglages
          </p>

          <div
            className="overflow-hidden rounded-[18px] border border-blue-100 shadow-[0_12px_26px_rgba(37,99,235,0.14)]"
            style={{ background: "#ffffff" }}
          >
            <div
              className="flex items-center justify-between px-3 py-2.5 text-white"
              style={{ background: `linear-gradient(135deg, ${settings.chatbotPrimaryColor}, ${withAlpha(settings.chatbotPrimaryColor, 0.9)})` }}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold leading-none">Assistant</p>
                  <p className="mt-0.5 text-[10px] text-white/80">En ligne</p>
                </div>
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-300" />
            </div>

            <div className="space-y-2.5 p-3" style={{ background: "#eff6ff" }}>
              <div className="flex justify-start">
                <div
                  className="max-w-[88%] rounded-2xl rounded-bl-md px-3 py-2"
                  style={{ background: "#ffffff", color: "#1e293b" }}
                >
                  <p className="text-[13px] leading-relaxed">{settings.chatbotWelcome || "Bonjour !"}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <div
                  className="max-w-[75%] rounded-2xl rounded-br-md px-3 py-2 text-white"
                  style={{ background: settings.chatbotPrimaryColor }}
                >
                  <p className="text-[13px] leading-relaxed">Bonjour, j&apos;ai une question.</p>
                </div>
              </div>

              {quickActions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quickActions.map((action, idx) => (
                    <span
                      key={`${action.label}-${idx}`}
                      className="rounded-full border border-white/10 px-2.5 py-1 text-[11px]"
                      style={{
                        borderColor: withAlpha(settings.chatbotPrimaryColor, 0.35),
                        color: "#1e293b",
                        background: withAlpha(settings.chatbotPrimaryColor, 0.16),
                      }}
                    >
                      {action.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="border-t border-blue-100 p-2.5" style={{ background: "#f8fafc" }}>
              <div className="flex items-center gap-2">
                <div
                  className="h-9 flex-1 rounded-full border border-blue-200 px-3 text-[12px]"
                  style={{
                    color: "#64748b",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Ecrivez votre message...
                </div>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                  style={{ background: `linear-gradient(135deg, ${settings.chatbotPrimaryColor}, ${withAlpha(settings.chatbotPrimaryColor, 0.9)})` }}
                >
                  <Send className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 p-3 text-xs text-slate-600" style={{ background: "#f8fafc" }}>
            Personnalite: <span className="font-semibold text-slate-900">{personalities.find((p) => p.value === settings.chatbotPersonality)?.label ?? "Amical"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ChatbotSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<ChatbotSettingsData>({
    chatbotEnabled: true,
    chatbotUseAI: true,
    chatbotWelcome: "Bonjour ! Comment puis-je vous aider ?",
    chatbotPersonality: "friendly",
    chatbotPrimaryColor: "#3B82F6",
    chatbotQuickActions: [],
    publicName: "",
    publicTitle: "",
    publicEmail: "",
    publicPhone: "",
    publicLocation: "",
    publicAvailability: "",
  });

  const [services, setServices] = useState<ChatbotService[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [faqs, setFaqs] = useState<ChatbotFAQ[]>([]);
  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [stats, setStats] = useState<ChatbotStats | null>(null);
  const [conversationFilter, setConversationFilter] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<ChatbotConversation | null>(null);

  const [showPreview, setShowPreview] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingService, setEditingService] = useState<ChatbotService | null>(null);
  const [editingSocial, setEditingSocial] = useState<SocialLink | null>(null);
  const [editingFAQ, setEditingFAQ] = useState<ChatbotFAQ | null>(null);

  useEffect(() => {
    void fetchAllData();
  }, []);

  useEffect(() => {
    if (activeTab === "conversations") {
      void fetchConversations(conversationFilter);
    }
  }, [conversationFilter, activeTab]);

  const fetchConversations = async (filter: string) => {
    try {
      const res = await fetch(`/api/chatbot/conversations?status=${filter}&limit=30`);
      if (res.ok) {
        const data = (await res.json()) as { conversations: ChatbotConversation[] };
        setConversations(data.conversations ?? []);
      } else {
        setConversations([]);
      }
    } catch (error) {
      setConversations([]);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [settingsRes, servicesRes, socialsRes, faqRes, convsRes, statsRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/chatbot/services"),
        fetch("/api/chatbot/social-links"),
        fetch("/api/chatbot/faq"),
        fetch("/api/chatbot/conversations?limit=30"),
        fetch("/api/chatbot/stats"),
      ]);

      if (settingsRes.ok) {
        const data = (await settingsRes.json()) as Partial<ChatbotSettingsData>;
        setSettings((prev) => ({ ...prev, ...data }));
      }
      if (servicesRes.ok) {
        const data = (await servicesRes.json()) as ChatbotService[];
        setServices(data);
      }
      if (socialsRes.ok) {
        const data = (await socialsRes.json()) as SocialLink[];
        setSocialLinks(data);
      }
      if (faqRes.ok) {
        const data = (await faqRes.json()) as ChatbotFAQ[];
        setFaqs(data);
      }
      if (convsRes.ok) {
        const data = (await convsRes.json()) as { conversations: ChatbotConversation[] };
        setConversations(data.conversations ?? []);
      }
      if (statsRes.ok) {
        const data = (await statsRes.json()) as ChatbotStats;
        setStats(data);
      }
    } catch (error) {
  console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/chatbot/conversations/${id}`);
      if (res.ok) {
        const data = (await res.json()) as ChatbotConversation;
        setSelectedConversation(data);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement");
    }
  };

  const updateConversationStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/chatbot/conversations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setSelectedConversation((prev) => prev ? { ...prev, status } : prev);
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status } : c))
        );
        toast.success("Statut mis a jour");
      }
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/chatbot/conversations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        setSelectedConversation(null);
        toast.success("Conversation supprimee");
      }
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success("Parametres enregistres");
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const addService = async () => {
    if (!editingService?.name) {
      toast.error("Le nom est requis");
      return;
    }

    try {
      const method = editingService.id ? "PUT" : "POST";
      const endpoint = editingService.id ? `/api/chatbot/services/${editingService.id}` : "/api/chatbot/services";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingService),
      });

      if (response.ok) {
        await fetchAllData();
        setEditingService(null);
        toast.success(editingService.id ? "Service mis a jour" : "Service ajoute");
      } else {
        toast.error("Erreur");
      }
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const deleteService = async (id: string) => {
    try {
      const response = await fetch(`/api/chatbot/services/${id}`, { method: "DELETE" });
      if (response.ok) {
        setServices(services.filter((s) => s.id !== id));
        toast.success("Supprime");
      }
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const addSocialLink = async () => {
    if (!editingSocial?.platform || !editingSocial?.url) {
      toast.error("Plateforme et URL requis");
      return;
    }

    try {
      const method = editingSocial.id ? "PUT" : "POST";
      const endpoint = editingSocial.id ? `/api/chatbot/social-links/${editingSocial.id}` : "/api/chatbot/social-links";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSocial),
      });

      if (response.ok) {
        await fetchAllData();
        setEditingSocial(null);
        toast.success(editingSocial.id ? "Reseau mis a jour" : "Reseau ajoute");
      }
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const deleteSocial = async (id: string) => {
    try {
      const response = await fetch(`/api/chatbot/social-links/${id}`, { method: "DELETE" });
      if (response.ok) {
        setSocialLinks(socialLinks.filter((s) => s.id !== id));
        toast.success("Supprime");
      }
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const addFAQ = async () => {
    if (!editingFAQ?.question || !editingFAQ?.answer) {
      toast.error("Question et reponse requis");
      return;
    }

    try {
      const method = editingFAQ.id ? "PUT" : "POST";
      const endpoint = editingFAQ.id ? `/api/chatbot/faq/${editingFAQ.id}` : "/api/chatbot/faq";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingFAQ),
      });

      if (response.ok) {
        await fetchAllData();
        setEditingFAQ(null);
        toast.success(editingFAQ.id ? "FAQ mise a jour" : "FAQ ajoutee");
      }
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const deleteFAQ = async (id: string) => {
    try {
      const response = await fetch(`/api/chatbot/faq/${id}`, { method: "DELETE" });
      if (response.ok) {
        setFaqs(faqs.filter((f) => f.id !== id));
        toast.success("Supprime");
      }
    } catch (error) {
      toast.error("Erreur");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--ui-primary)]" />
      </div>
    );
  }

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "info", label: "Infos", icon: Users },
    { id: "services", label: "Services", icon: Cpu },
    { id: "social", label: "Reseaux", icon: LinkIcon },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "conversations", label: "Messages", icon: MessageSquare },
    { id: "stats", label: "Stats", icon: BarChart3 },
  ];

  const previewVisible = showPreview && activeTab !== "conversations" && activeTab !== "stats";

  return (
    <div className="mx-auto w-full max-w-[1280px] p-6">
      <div className={`grid gap-6 ${previewVisible ? "xl:grid-cols-[minmax(0,1fr)_380px]" : "grid-cols-1"}`}>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--ui-text)" }}>Configuration Chatbot</h1>
              <p className="mt-1" style={{ color: "var(--ui-text-secondary)" }}>
                Personnalisez l&apos;assistant virtuel
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                style={
                  showPreview
                    ? { background: "var(--ui-primary-soft)", borderColor: "var(--ui-primary)", color: "var(--ui-primary)" }
                    : { background: "var(--ui-card)", borderColor: "var(--ui-border)", color: "var(--ui-text-secondary)" }
                }
              >
                <Eye className="h-4 w-4" />
              </button>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Enregistrer
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 border-b" style={{ borderColor: "var(--ui-border)" }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2 transition text-sm ${
                    activeTab === tab.id
                      ? "border-[var(--ui-primary)] text-[var(--ui-primary)]"
                      : "border-transparent text-[var(--ui-text-secondary)] hover:text-[var(--ui-text)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* GENERAL TAB */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium" style={{ color: "var(--ui-text)" }}>Chatbot actif</p>
                      <p className="text-sm" style={{ color: "var(--ui-text-secondary)" }}>
                        Le widget apparaitra sur le site public
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: settings.chatbotEnabled ? "var(--ui-primary)" : "var(--ui-text-muted)" }}>
                        {settings.chatbotEnabled ? "ON" : "OFF"}
                      </span>
                      <ToggleSwitch
                        label="Activer le chatbot"
                        checked={settings.chatbotEnabled}
                        onToggle={() => setSettings({ ...settings, chatbotEnabled: !settings.chatbotEnabled })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--ui-border)" }}>
                    <div>
                      <p className="font-medium" style={{ color: "var(--ui-text)" }}>Utiliser IA (Groq)</p>
                      <p className="text-sm" style={{ color: "var(--ui-text-secondary)" }}>
                        Reponses intelligentes
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: settings.chatbotUseAI ? "var(--ui-primary)" : "var(--ui-text-muted)" }}>
                        {settings.chatbotUseAI ? "ON" : "OFF"}
                      </span>
                      <ToggleSwitch
                        label="Activer IA Groq"
                        checked={settings.chatbotUseAI}
                        onToggle={() => setSettings({ ...settings, chatbotUseAI: !settings.chatbotUseAI })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Apparence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium" style={{ color: "var(--ui-text)" }}>
                      Couleur primaire
                    </label>
                    <div className="flex items-center gap-3 mt-2">
                      <input type="color" value={settings.chatbotPrimaryColor} onChange={(e) => setSettings({ ...settings, chatbotPrimaryColor: e.target.value })} className="h-10 w-16 rounded cursor-pointer" />
                      <Input value={settings.chatbotPrimaryColor} onChange={(e) => setSettings({ ...settings, chatbotPrimaryColor: e.target.value })} className="flex-1 font-mono text-sm" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Personnalite</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {personalities.map((p) => (
                    <label key={p.value} className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="personality" value={p.value} checked={settings.chatbotPersonality === p.value} onChange={(e) => setSettings({ ...settings, chatbotPersonality: e.target.value })} className="mt-1 h-4 w-4" />
                      <div>
                        <p className="font-medium" style={{ color: "var(--ui-text)" }}>{p.label}</p>
                        <p className="text-sm" style={{ color: "var(--ui-text-secondary)" }}>{p.description}</p>
                      </div>
                    </label>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Message de bienvenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea value={settings.chatbotWelcome} onChange={(e) => setSettings({ ...settings, chatbotWelcome: e.target.value })} placeholder="Bonjour !" rows={4} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {settings.chatbotQuickActions.map((action, idx) => (
                    <div key={idx} className="space-y-2 p-3 rounded border" style={{ borderColor: "var(--ui-border)", background: "var(--ui-input-bg)" }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: "var(--ui-text-secondary)" }}>Action {idx + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => { setSettings({ ...settings, chatbotQuickActions: settings.chatbotQuickActions.filter((_, i) => i !== idx) }); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input placeholder="Libellé du bouton (ex: Voir mes projets)" value={action.label} onChange={(e) => { const newActions = [...settings.chatbotQuickActions]; newActions[idx].label = e.target.value; setSettings({ ...settings, chatbotQuickActions: newActions }); }} />
                      <Input placeholder="Message envoyé au chatbot (ex: Je veux voir vos projets)" value={action.message} onChange={(e) => { const newActions = [...settings.chatbotQuickActions]; newActions[idx].message = e.target.value; setSettings({ ...settings, chatbotQuickActions: newActions }); }} />
                      <Input placeholder="URL de redirection optionnelle (ex: /projects ou https://...)" value={action.url ?? ""} onChange={(e) => { const newActions = [...settings.chatbotQuickActions]; newActions[idx].url = e.target.value || undefined; setSettings({ ...settings, chatbotQuickActions: newActions }); }} />
                      <p className="text-[10px]" style={{ color: "var(--ui-text-muted)" }}>Si une URL est définie, le bouton redirigera directement vers cette page.</p>
                    </div>
                  ))}
                  <Button variant="outline" onClick={() => { setSettings({ ...settings, chatbotQuickActions: [...settings.chatbotQuickActions, { label: "", message: "", url: "" }] }); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une action
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* INFO TAB */}
          {activeTab === "info" && (
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--ui-text-secondary)" }}>Votre nom <span className="text-red-500">*</span></label>
                  <Input placeholder="Ex: Max Houngbedji" value={settings.publicName || ""} onChange={(e) => setSettings({ ...settings, publicName: e.target.value })} />
                  <p className="text-[10px] mt-1" style={{ color: "var(--ui-text-muted)" }}>Le chatbot utilisera ce nom pour se présenter</p>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--ui-text-secondary)" }}>Titre / Fonction</label>
                  <Input placeholder="Ex: Designer & Développeur Frontend" value={settings.publicTitle || ""} onChange={(e) => setSettings({ ...settings, publicTitle: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--ui-text-secondary)" }}>Email public</label>
                  <Input type="email" placeholder="Ex: contact@maxhgd.com" value={settings.publicEmail || ""} onChange={(e) => setSettings({ ...settings, publicEmail: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--ui-text-secondary)" }}>Téléphone</label>
                  <Input placeholder="Ex: +229 97 00 00 00" value={settings.publicPhone || ""} onChange={(e) => setSettings({ ...settings, publicPhone: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--ui-text-secondary)" }}>Localisation</label>
                  <Input placeholder="Ex: Cotonou, Bénin" value={settings.publicLocation || ""} onChange={(e) => setSettings({ ...settings, publicLocation: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--ui-text-secondary)" }}>Disponibilité</label>
                  <Input placeholder="Ex: Disponible pour nouveaux projets" value={settings.publicAvailability || ""} onChange={(e) => setSettings({ ...settings, publicAvailability: e.target.value })} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* SERVICES TAB */}
          {activeTab === "services" && (
            <div className="space-y-4">
              {editingService && (
                <Card className="border-2" style={{ borderColor: "var(--ui-primary)" }}>
                  <CardHeader>
                    <CardTitle>Edition du service</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input placeholder="Nom" value={editingService.name} onChange={(e) => setEditingService({ ...editingService, name: e.target.value })} />
                    <Textarea placeholder="Description" value={editingService.description || ""} onChange={(e) => setEditingService({ ...editingService, description: e.target.value })} rows={3} />
                    <Input placeholder="Gamme de prix" value={editingService.priceRange || ""} onChange={(e) => setEditingService({ ...editingService, priceRange: e.target.value })} />
                    <div className="flex gap-2">
                      <Button onClick={addService} size="sm">
                        <Check className="h-4 w-4 mr-2" />
                        Enregistrer
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingService(null)}>
                        Annuler
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="space-y-3">
                {services.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold" style={{ color: "var(--ui-text)" }}>{s.name}</h3>
                          {s.description && <p style={{ color: "var(--ui-text-secondary)" }} className="text-sm mt-1">{s.description}</p>}
                          {s.priceRange && <p className="text-xs mt-2" style={{ color: "var(--ui-primary)" }}>💰 {s.priceRange}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingService(s)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => void deleteService(s.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {!editingService && (
                <Button onClick={() => setEditingService({ id: "", name: "", order: services.length, isActive: true })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un service
                </Button>
              )}
            </div>
          )}

          {/* SOCIAL TAB */}
          {activeTab === "social" && (
            <div className="space-y-4">
              {editingSocial && (
                <Card className="border-2" style={{ borderColor: "var(--ui-primary)" }}>
                  <CardHeader>
                    <CardTitle>Edition du reseau</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <select
                      value={editingSocial.platform}
                      onChange={(e) => setEditingSocial({ ...editingSocial, platform: e.target.value })}
                      className="w-full h-11 rounded-lg border px-4"
                      style={{ borderColor: "var(--ui-border)", background: "var(--ui-input-bg)", color: "var(--ui-text)" }}
                    >
                      <option value="">Selectionner une plateforme</option>
                      {socialPlatforms.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <Input placeholder="URL" value={editingSocial.url} onChange={(e) => setEditingSocial({ ...editingSocial, url: e.target.value })} />
                    <Input placeholder="Utilisateur (optionnel)" value={editingSocial.username || ""} onChange={(e) => setEditingSocial({ ...editingSocial, username: e.target.value })} />
                    <div className="flex gap-2">
                      <Button onClick={addSocialLink} size="sm">
                        <Check className="h-4 w-4 mr-2" />
                        Enregistrer
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingSocial(null)}>
                        Annuler
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="space-y-3">
                {socialLinks.map((link) => (
                  <Card key={link.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold" style={{ color: "var(--ui-text)" }}>
                            {socialPlatforms.find((p) => p.value === link.platform)?.label}
                          </h3>
                          {link.username && <p className="text-sm mt-1" style={{ color: "var(--ui-text-secondary)" }}>@{link.username}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingSocial(link)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => void deleteSocial(link.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {!editingSocial && (
                <Button onClick={() => setEditingSocial({ id: "", platform: "", url: "", isActive: true, order: socialLinks.length })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un reseau
                </Button>
              )}
            </div>
          )}

          {/* FAQ TAB */}
          {activeTab === "faq" && (
            <div className="space-y-4">
              {editingFAQ && (
                <Card className="border-2" style={{ borderColor: "var(--ui-primary)" }}>
                  <CardHeader>
                    <CardTitle>Edition FAQ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input placeholder="Question" value={editingFAQ.question} onChange={(e) => setEditingFAQ({ ...editingFAQ, question: e.target.value })} />
                    <Textarea placeholder="Reponse" value={editingFAQ.answer} onChange={(e) => setEditingFAQ({ ...editingFAQ, answer: e.target.value })} rows={4} />
                    <Input placeholder="Categorie (optionnel)" value={editingFAQ.category || ""} onChange={(e) => setEditingFAQ({ ...editingFAQ, category: e.target.value })} />
                    <div className="flex gap-2">
                      <Button onClick={addFAQ} size="sm">
                        <Check className="h-4 w-4 mr-2" />
                        Enregistrer
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingFAQ(null)}>
                        Annuler
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <Card key={faq.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold" style={{ color: "var(--ui-text)" }}>{faq.question}</h3>
                          <p className="text-sm mt-2" style={{ color: "var(--ui-text-secondary)" }}>{faq.answer}</p>
                          {faq.category && <span className="inline-block mt-2 px-2 py-1 text-xs rounded" style={{ background: "var(--ui-input-bg)" }}>{faq.category}</span>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingFAQ(faq)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => void deleteFAQ(faq.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {!editingFAQ && (
                <Button onClick={() => setEditingFAQ({ id: "", question: "", answer: "", order: faqs.length, isActive: true })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une FAQ
                </Button>
              )}
            </div>
          )}

          {/* CONVERSATIONS TAB */}
          {activeTab === "conversations" && (
            <div className="grid min-h-[600px] grid-cols-1 gap-0 overflow-hidden rounded-xl border lg:grid-cols-[340px_1fr]" style={{ borderColor: "var(--ui-border)" }}>
              {/* Colonne gauche : liste */}
              <div className="flex flex-col border-r" style={{ borderColor: "var(--ui-border)", background: "var(--ui-card)" }}>
                <div className="flex items-center justify-between border-b p-4" style={{ borderColor: "var(--ui-border)" }}>
                  <span className="font-semibold text-sm" style={{ color: "var(--ui-text)" }}>
                    Conversations ({conversations.length})
                  </span>
                  <select
                    value={conversationFilter}
                    onChange={(e) => setConversationFilter(e.target.value)}
                    className="h-8 rounded-lg border px-2 text-xs"
                    style={{ borderColor: "var(--ui-border)", background: "var(--ui-input-bg)", color: "var(--ui-text)" }}
                  >
                    <option value="all">Toutes</option>
                    <option value="active">Actives</option>
                    <option value="needs_followup">A suivre</option>
                    <option value="closed">Terminees</option>
                    <option value="archived">Archivees</option>
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <MessageSquare className="mb-3 h-10 w-10" style={{ color: "var(--ui-text-muted)" }} />
                      <p className="font-medium text-sm" style={{ color: "var(--ui-text-muted)" }}>Aucune conversation</p>
                      <p className="mt-1 text-xs" style={{ color: "var(--ui-text-muted)" }}>
                        Les echanges avec les visiteurs apparaitront ici
                      </p>
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const statusLabel: Record<string, string> = {
                        active: "Active",
                        needs_followup: "A suivre",
                        closed: "Terminee",
                        archived: "Archivee",
                      };
                      const statusDot: Record<string, string> = {
                        active: "#22c55e",
                        needs_followup: "#eab308",
                        closed: "#3b82f6",
                        archived: "#94a3b8",
                      };
                      const isSelected = selectedConversation?.id === conv.id;
                      return (
                        <button
                          key={conv.id}
                          onClick={() => void viewConversation(conv.id)}
                          className="w-full border-b px-4 py-3 text-left transition-colors"
                          style={{
                            borderColor: "var(--ui-border)",
                            background: isSelected ? "var(--ui-primary-soft)" : "transparent",
                            borderLeft: isSelected ? "3px solid var(--ui-primary)" : "3px solid transparent",
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--ui-input-bg)"; }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--ui-primary-soft)" }}>
                              <User className="h-4 w-4" style={{ color: "var(--ui-primary)" }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate text-sm font-medium" style={{ color: "var(--ui-text)" }}>
                                  {conv.visitorName ?? `Visiteur ${conv.sessionId.slice(0, 8)}`}
                                </span>
                                <span className="shrink-0 text-[10px]" style={{ color: "var(--ui-text-muted)" }}>
                                  {new Date(conv.updatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                                </span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: statusDot[conv.status] ?? "#94a3b8" }} />
                                <span className="text-[11px]" style={{ color: "var(--ui-text-muted)" }}>
                                  {statusLabel[conv.status] ?? conv.status}
                                </span>
                                <span className="text-[11px]" style={{ color: "var(--ui-text-muted)" }}>
                                  · {conv._count.messages} msg
                                </span>
                              </div>
                              <p className="mt-1 truncate text-xs" style={{ color: "var(--ui-text-secondary)" }}>
                                {conv.messages[0]?.content ?? "Pas de message"}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Colonne droite : detail */}
              <div className="flex flex-col" style={{ background: "var(--ui-card)" }}>
                {selectedConversation ? (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--ui-border)" }}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--ui-primary-soft)" }}>
                          <User className="h-4 w-4" style={{ color: "var(--ui-primary)" }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--ui-text)" }}>
                            {selectedConversation.visitorName ?? `Visiteur ${selectedConversation.sessionId.slice(0, 8)}`}
                          </p>
                          <p className="text-xs" style={{ color: "var(--ui-text-muted)" }}>
                            {selectedConversation.messages.length} message{selectedConversation.messages.length > 1 ? "s" : ""}
                            {selectedConversation.visitorEmail ? ` · ${selectedConversation.visitorEmail}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedConversation.status}
                          onChange={(e) => void updateConversationStatus(selectedConversation.id, e.target.value)}
                          className="h-8 rounded-lg border px-2 text-xs"
                          style={{ borderColor: "var(--ui-border)", background: "var(--ui-input-bg)", color: "var(--ui-text)" }}
                        >
                          <option value="active">Active</option>
                          <option value="needs_followup">A suivre</option>
                          <option value="closed">Terminee</option>
                          <option value="archived">Archivee</option>
                        </select>
                        <button
                          onClick={() => void deleteConversation(selectedConversation.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors"
                          style={{ background: "transparent" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ background: "var(--ui-input-bg)", maxHeight: "480px" }}>
                      {selectedConversation.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.role === "user" ? "rounded-br-md" : "rounded-bl-md"}`}
                            style={
                              msg.role === "user"
                                ? { background: "var(--ui-primary)", color: "#fff" }
                                : { background: "var(--ui-card)", color: "var(--ui-text)" }
                            }
                          >
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                            <p className="mt-1 text-right text-[10px]" style={{ color: msg.role === "user" ? "rgba(255,255,255,0.65)" : "var(--ui-text-muted)" }}>
                              {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer info */}
                    <div className="border-t px-4 py-2" style={{ borderColor: "var(--ui-border)" }}>
                      <p className="text-[11px]" style={{ color: "var(--ui-text-muted)" }}>
                        Debut : {new Date(selectedConversation.createdAt).toLocaleString("fr-FR")}
                        {" · "}
                        Derniere activite : {new Date(selectedConversation.updatedAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "var(--ui-input-bg)" }}>
                      <MessageSquare className="h-7 w-7" style={{ color: "var(--ui-text-muted)" }} />
                    </div>
                    <p className="font-medium" style={{ color: "var(--ui-text)" }}>Selectionnez une conversation</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--ui-text-muted)" }}>
                      Cliquez sur une conversation pour voir les messages
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STATS TAB */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              {stats ? (
                <>
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                      { label: "Total", value: stats.totalConversations },
                      { label: "Ce mois", value: stats.conversationsThisMonth },
                      { label: "Cette semaine", value: stats.conversationsThisWeek },
                      { label: "Messages", value: stats.totalMessages },
                    ].map(({ label, value }) => (
                      <Card key={label}>
                        <CardContent className="p-4">
                          <p className="text-sm" style={{ color: "var(--ui-text-muted)" }}>{label}</p>
                          <p className="text-2xl font-bold" style={{ color: "var(--ui-text)" }}>{value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Statuts</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-500" />
                            <span style={{ color: "var(--ui-text)" }}>Actives</span>
                          </div>
                          <span className="font-medium" style={{ color: "var(--ui-text)" }}>{stats.activeConversations}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-yellow-500" />
                            <span style={{ color: "var(--ui-text)" }}>A suivre</span>
                          </div>
                          <span className="font-medium" style={{ color: "var(--ui-text)" }}>{stats.needsFollowup}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Sujets les plus demandes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {stats.topThemes.length > 0 ? (
                          <div className="space-y-3">
                            {stats.topThemes.map((item) => (
                              <div key={item.theme} className="flex items-center justify-between">
                                <span style={{ color: "var(--ui-text)" }}>{item.theme}</span>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-20 overflow-hidden rounded-full" style={{ background: "var(--ui-border)" }}>
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        background: "var(--ui-primary)",
                                        width: `${Math.min(100, (item.count / (stats.topThemes[0]?.count || 1)) * 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="w-6 text-right text-sm font-medium" style={{ color: "var(--ui-text-muted)" }}>
                                    {item.count}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="py-4 text-center text-sm" style={{ color: "var(--ui-text-muted)" }}>
                            Pas encore de donnees
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center">
                  <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" style={{ color: "var(--ui-primary)" }} />
                  <p style={{ color: "var(--ui-text-muted)" }}>Chargement des statistiques...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {previewVisible && <ChatbotPreview settings={settings} />}
      </div>
    </div>
  );
}

