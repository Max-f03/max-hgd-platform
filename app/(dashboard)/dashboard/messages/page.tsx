"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Tooltip from "@/components/ui/tooltip";

type MessageStatus = "sent" | "delivered" | "read";
type MessageKind = "text" | "voice" | "video" | "attachment" | "location" | "contact" | "poll";

interface ChatItem {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
  status?: MessageStatus;
  kind?: MessageKind;
}
interface Conversation {
  id: string;
  sender: string;
  initials: string;
  phone: string;
  role: string;
  preview: string;
  dayTime: string;
  time: string;
  unread: boolean;
  unreadMessages: number;
  avatarBg: string;
  avatarText: string;
  sharedMedia: string[];
  messages: ChatItem[];
}
const conversations: Conversation[] = [
  {
    id: "1",
    sender: "Thomas Dupont",
    initials: "TD",
    phone: "+33 6 00 11 22 33",
    role: "Client",
    preview: "j'aimerais discuter du projet e-commerce. Quand etes-vous disponible ?",
    dayTime: "Mardi 10:32",
    time: "il y a 2h",
    unread: true,
    unreadMessages: 3,
    avatarBg: "var(--ui-status-info-bg)",
    avatarText: "var(--ui-status-info-text)",
    sharedMedia: ["brief-projet.pdf", "wireframe-home.png", "plan-sprint.docx"],
    messages: [
      { id: "1-1", from: "them", text: "Bonjour, j'aimerais discuter du projet e-commerce. Quand etes-vous disponible ?", time: "10:32", kind: "text" },
      { id: "1-2", from: "me", text: "Bonjour Thomas, je suis disponible cette semaine. Jeudi vous conviendrait ?", time: "10:45", status: "read", kind: "text" },
      { id: "1-3", from: "them", text: "Parfait, jeudi 14h me convient tres bien.", time: "11:00", kind: "text" },
    ],
  },
  {
    id: "2",
    sender: "Sophie Martin",
    initials: "SM",
    phone: "+33 7 40 15 20 99",
    role: "Marketing",
    preview: "je voulais vous remercier pour la livraison du design system. Tout est parfait !",
    dayTime: "Lundi 15:20",
    time: "hier",
    unread: false,
    unreadMessages: 0,
    avatarBg: "var(--ui-status-info-bg)",
    avatarText: "var(--ui-status-info-text)",
    sharedMedia: ["logo-final.svg", "charte-couleurs.pdf"],
    messages: [
      { id: "2-1", from: "them", text: "Bonjour, je voulais vous remercier pour la livraison du design system. Tout est parfait !", time: "15:20", kind: "text" },
      { id: "2-2", from: "me", text: "Merci Sophie, c'est un plaisir. N'hesitez pas si vous avez des questions.", time: "15:35", status: "delivered", kind: "text" },
    ],
  },
  {
    id: "3",
    sender: "Agence Crea",
    initials: "AC",
    phone: "+33 1 80 00 31 31",
    role: "Agence",
    preview: "pouvez-vous nous envoyer la derniere version des maquettes pour validation ?",
    dayTime: "Samedi 09:15",
    time: "il y a 3j",
    unread: true,
    unreadMessages: 1,
    avatarBg: "var(--ui-status-info-bg)",
    avatarText: "var(--ui-status-info-text)",
    sharedMedia: ["maquette-v3.fig"],
    messages: [
      { id: "3-1", from: "them", text: "Bonjour, pouvez-vous nous envoyer la derniere version des maquettes pour validation ?", time: "09:15", kind: "text" },
    ],
  },
  {
    id: "4",
    sender: "Lucas Bernard",
    initials: "LB",
    phone: "+33 6 12 45 81 72",
    role: "Startup",
    preview: "Bonne nouvelle : le budget a ete valide. On peut demarrer quand vous voulez.",
    dayTime: "Jeudi 14:00",
    time: "il y a 5j",
    unread: false,
    unreadMessages: 0,
    avatarBg: "#FEF3C7",
    avatarText: "#B45309",
    sharedMedia: ["contrat-signe.pdf", "roadmap-q2.png"],
    messages: [
      { id: "4-1", from: "them", text: "Bonne nouvelle : le budget a ete valide. On peut demarrer quand vous voulez.", time: "14:00", kind: "text" },
      { id: "4-2", from: "me", text: "Excellent ! Je prepare le planning et vous l'envoie demain.", time: "14:15", status: "read", kind: "text" },
    ],
  },
];

function buildTimeLabel() {
  const now = new Date();
  return `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function TickMarks({ status }: { status?: MessageStatus }) {
  if (!status) return null;

  if (status === "sent") {
    return <span style={{ color: "var(--ui-text-muted)" }}>✓</span>;
  }

  const color = status === "read" ? "var(--ui-primary)" : "var(--ui-text-muted)";
  return (
    <span className="inline-flex">
      <span style={{ color }}>{"\u2713"}</span>
      <span className="-ml-1" style={{ color }}>{"\u2713"}</span>
    </span>
  );
}

export default function MessagesPage() {
  const router = useRouter();
  const documentsInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const micHoldTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const micStartRef = useRef<number | null>(null);

  const [activeId, setActiveId] = useState("1");
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [headerFeedback, setHeaderFeedback] = useState("");
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [inputMode, setInputMode] = useState<"voice" | "video">("voice");
  const [search, setSearch] = useState("");
  const [lockedConversationIds, setLockedConversationIds] = useState<string[]>([]);
  const [mutedConversationIds, setMutedConversationIds] = useState<string[]>([]);
  const [ephemeralConversationIds, setEphemeralConversationIds] = useState<string[]>([]);
  const [localMessages, setLocalMessages] = useState<Record<string, ChatItem[]>>({});
  const [filterMode, setFilterMode] = useState<"all" | "unread" | "read">("all");

  const filteredConversations = conversations.filter((conv) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return conv.sender.toLowerCase().includes(q) || conv.preview.toLowerCase().includes(q);
  }).filter((conv) => {
    if (filterMode === "unread") return conv.unreadMessages > 0;
    if (filterMode === "read") return conv.unreadMessages === 0;
    return true;
  }).sort((a, b) => {
    if (b.unreadMessages !== a.unreadMessages) {
      return b.unreadMessages - a.unreadMessages;
    }
    return 0;
  });

  const activeConv = conversations.find((c) => c.id === activeId) ?? filteredConversations[0];
  const allMessages = [...(activeConv?.messages ?? []), ...(localMessages[activeConv?.id ?? activeId] ?? [])];
  const unreadCount = conversations.reduce((total, conv) => total + conv.unreadMessages, 0);

  const isActiveLocked = !!activeConv && lockedConversationIds.includes(activeConv.id);
  const isActiveMuted = !!activeConv && mutedConversationIds.includes(activeConv.id);
  const isActiveEphemeral = !!activeConv && ephemeralConversationIds.includes(activeConv.id);

  function flashFeedback(text: string, delay = 2000) {
    setHeaderFeedback(text);
    setTimeout(() => setHeaderFeedback(""), delay);
  }

  function appendOutgoingMessage(text: string, kind: MessageKind = "text") {
    if (!activeConv) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const message: ChatItem = {
      id,
      from: "me",
      text,
      time: buildTimeLabel(),
      status: "sent",
      kind,
    };

    setLocalMessages((prev) => ({
      ...prev,
      [activeConv.id]: [...(prev[activeConv.id] ?? []), message],
    }));

    setTimeout(() => {
      setLocalMessages((prev) => ({
        ...prev,
        [activeConv.id]: (prev[activeConv.id] ?? []).map((msg) => (msg.id === id ? { ...msg, status: "delivered" } : msg)),
      }));
    }, 900);

    setTimeout(() => {
      setLocalMessages((prev) => ({
        ...prev,
        [activeConv.id]: (prev[activeConv.id] ?? []).map((msg) => (msg.id === id ? { ...msg, status: "read" } : msg)),
      }));
    }, 2100);
  }

  function handleSend() {
    if (!inputValue.trim() && attachments.length === 0) return;

    const parts = [inputValue.trim()];
    if (attachments.length) {
      parts.push(`Pieces jointes: ${attachments.join(", ")}`);
    }

    appendOutgoingMessage(parts.filter(Boolean).join("\n"), attachments.length ? "attachment" : "text");
    setInputValue("");
    setAttachments([]);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  function handleVoiceCall() {
    if (!activeConv) return;
    flashFeedback(`Appel vocal vers ${activeConv.sender}...`, 1800);
    window.location.href = "tel:+33123456789";
  }

  function handleVideoCall() {
    if (!activeConv) return;
    flashFeedback(`Appel video vers ${activeConv.sender}...`, 1800);
  }

  function handleArchiveConversation() {
    if (!activeConv) return;
    setShowActionsMenu(false);
    flashFeedback(`Conversation avec ${activeConv.sender} archivee.`, 2200);
  }

  function handleOpenClientProfile() {
    if (!activeConv) return;
    setShowActionsMenu(false);
    router.push("/dashboard/clients");
  }

  function handleSearchInDiscussion() {
    if (!activeConv) return;
    setShowActionsMenu(false);
    const query = window.prompt("Rechercher un mot dans cette discussion :");
    if (!query?.trim()) return;

    const count = allMessages.filter((msg) => msg.text.toLowerCase().includes(query.trim().toLowerCase())).length;
    flashFeedback(`${count} resultat(s) pour \"${query.trim()}\"`, 2500);
  }

  function handleChangeWallpaper() {
    setShowActionsMenu(false);
    flashFeedback("Fond d'ecran de discussion modifie.", 1800);
  }

  function handleBlockContact() {
    if (!activeConv) return;
    setShowActionsMenu(false);
    const ok = window.confirm(`Bloquer ${activeConv.sender} ?`);
    if (!ok) return;
    flashFeedback(`${activeConv.sender} a ete bloque.`, 2000);
  }

  function handleReportContact() {
    if (!activeConv) return;
    setShowActionsMenu(false);
    const ok = window.confirm(`Signaler ${activeConv.sender} ?`);
    if (!ok) return;
    flashFeedback(`Signalement envoye pour ${activeConv.sender}.`, 2000);
  }

  function handleToggleLockConversation() {
    if (!activeConv) return;
    setShowActionsMenu(false);
    setLockedConversationIds((prev) => {
      if (prev.includes(activeConv.id)) {
        flashFeedback("Discussion deverrouillee.", 1800);
        return prev.filter((id) => id !== activeConv.id);
      }
      flashFeedback("Discussion verrouillee.", 1800);
      return [...prev, activeConv.id];
    });
  }

  function handleAddEmoji(emoji: string) {
    setInputValue((prev) => `${prev}${emoji}`);
  }

  function addFilesAsAttachments(files: FileList | null) {
    if (!files?.length) return;
    setAttachments((prev) => [...prev, ...Array.from(files).map((file) => file.name)]);
  }

  function handleSendLocation() {
    setShowAttachMenu(false);
    if (!navigator.geolocation) {
      flashFeedback("Geolocalisation non supportee sur cet appareil.", 2200);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        appendOutgoingMessage(`Position partagee: https://maps.google.com/?q=${latitude},${longitude}`, "location");
      },
      () => {
        flashFeedback("Impossible de recuperer votre position.", 2200);
      }
    );
  }

  function handleShareContact() {
    setShowAttachMenu(false);
    const contactName = window.prompt("Nom du contact a partager :");
    if (!contactName?.trim()) return;
    const contactPhone = window.prompt("Numero du contact :");
    if (!contactPhone?.trim()) return;
    appendOutgoingMessage(`Contact partage: ${contactName.trim()} - ${contactPhone.trim()}`, "contact");
  }

  function handleCreatePoll() {
    setShowAttachMenu(false);
    const question = window.prompt("Question du sondage :");
    if (!question?.trim()) return;
    const optionsRaw = window.prompt("Options du sondage (separees par des virgules) :");
    if (!optionsRaw?.trim()) return;

    const options = optionsRaw
      .split(",")
      .map((opt) => opt.trim())
      .filter(Boolean)
      .slice(0, 8);

    if (!options.length) return;
    appendOutgoingMessage(`Sondage: ${question.trim()}\n- ${options.join("\n- ")}`, "poll");
  }

  function handleMicPressStart() {
    micStartRef.current = Date.now();
    micHoldTimeoutRef.current = setTimeout(() => {
      setIsRecordingVoice(true);
      flashFeedback("Enregistrement vocal... relachez pour envoyer", 1200);
    }, 260);
  }

  function handleMicPressEnd() {
    if (micHoldTimeoutRef.current) {
      clearTimeout(micHoldTimeoutRef.current);
      micHoldTimeoutRef.current = null;
    }

    const startedAt = micStartRef.current;
    micStartRef.current = null;

    if (isRecordingVoice && startedAt) {
      const duration = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      setIsRecordingVoice(false);
      appendOutgoingMessage(`[Message vocal ${duration}s]`, "voice");
      flashFeedback("Message vocal envoye.", 1700);
      return;
    }

    setInputMode((prev) => {
      const next = prev === "voice" ? "video" : "voice";
      flashFeedback(next === "voice" ? "Mode vocal actif." : "Mode video actif.", 1400);
      return next;
    });
  }

  function handleConversationClick(conversationId: string) {
    const locked = lockedConversationIds.includes(conversationId);
    if (locked) {
      const ok = window.confirm("Cette discussion est verrouillee. Voulez-vous l'ouvrir ?");
      if (!ok) return;
    }

    setActiveId(conversationId);
    setShowListOnMobile(false);
    setShowActionsMenu(false);
    setShowInfoPanel(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div style={{ animation: "reveal-up 0.7s ease-out both" }}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Communication</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Messagerie</h2>
        <p className="mt-1 text-sm text-slate-500">Suivi des echanges clients en temps reel</p>
      </div>

      <div
        className="grid h-[calc(100vh-14rem)] min-h-[520px] overflow-hidden rounded-3xl border border-blue-100 bg-white"
        style={{ gridTemplateColumns: "290px 1fr", animation: "reveal-up 0.7s ease-out both", animationDelay: "130ms" }}
      >
        <aside
          className={[
            "flex min-w-0 flex-col border-r border-blue-100 bg-blue-50/40",
            showListOnMobile ? "flex" : "hidden md:flex",
          ].join(" ")}
        >
          <div className="border-b border-blue-100 px-3.5 py-3">
            <div className="flex items-center justify-between">
              <button type="button" className="flex items-center gap-1 text-xs font-semibold text-slate-900">
                All Messages
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 transition hover:bg-blue-50" aria-label="Options">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>
            </div>

            <div className="mt-3 flex gap-1.5">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  filterMode === "all"
                    ? "bg-blue-100 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("unread")}
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  filterMode === "unread"
                    ? "bg-blue-100 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                En attente ({conversations.reduce((t, c) => t + c.unreadMessages, 0)})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("read")}
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  filterMode === "read"
                    ? "bg-blue-100 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                Lus
              </button>
            </div>

            <div className="mt-2.5 relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search or start a new chat"
                className="w-full rounded-lg border border-blue-100 bg-white py-2 pl-8 pr-3 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <p className="mt-1.5 text-[10px] text-slate-500">{unreadCount} message(s) en attente</p>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => handleConversationClick(conv.id)}
                className={[
                  "mb-1 w-full rounded-xl px-3 py-2.5 text-left transition",
                  activeId === conv.id 
                    ? "bg-white"
                    : conv.unreadMessages > 0
                    ? "bg-blue-50/50 hover:bg-blue-50"
                    : "bg-transparent hover:bg-white",
                ].join(" ")}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={[
                      "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0",
                      "",
                    ].join(" ")}
                    style={{ background: conv.avatarBg, color: conv.avatarText }}
                  >
                    {conv.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={[
                        "truncate text-[13px] font-semibold",
                        conv.unreadMessages > 0 ? "text-slate-900" : "text-slate-700",
                      ].join(" ")}>
                        {conv.sender}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-400">{conv.time}</span>
                    </div>
                    <p className={[
                      "mt-0.5 truncate text-[11px] leading-tight",
                      conv.unreadMessages > 0 ? "font-semibold text-slate-800" : "font-normal text-slate-600",
                    ].join(" ")}>
                      {conv.preview}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5">
                        {lockedConversationIds.includes(conv.id) && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        )}
                        <span className="text-[10px] text-slate-400">{conv.dayTime}</span>
                      </div>
                      {conv.unreadMessages > 0 ? (
                        <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                          {conv.unreadMessages}
                        </span>
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

        </aside>

        <section className={["relative flex flex-col min-w-0", showListOnMobile ? "hidden md:flex" : "flex"].join(" ")}>
          {activeConv ? (
            <>
              <header className="flex shrink-0 items-center gap-2.5 border-b border-blue-100 bg-white px-4 py-3">
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
                  onClick={() => setShowListOnMobile(true)}
                  aria-label="Retour"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setShowInfoPanel(true)}
                  className="flex items-center gap-2 min-w-0"
                  aria-label="Ouvrir les infos du contact"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: activeConv.avatarBg, color: activeConv.avatarText }}>
                    {activeConv.initials}
                  </div>

                  <div className="min-w-0 text-left">
                    <p className="truncate text-[13px] font-semibold text-slate-900">{activeConv.sender}</p>
                    <p className="text-[11px] text-slate-500">{activeConv.role}</p>
                  </div>
                </button>

                {headerFeedback && <p className="ml-2 text-xs text-blue-700">{headerFeedback}</p>}

                <div className="ml-auto flex items-center gap-1.5 relative">
                  <button type="button" onClick={handleVideoCall} className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50" aria-label="Appel video">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </button>
                  <button type="button" onClick={handleVoiceCall} className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50" aria-label="Appel vocal">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => setShowActionsMenu((prev) => !prev)} className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50" aria-label="Menu">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </button>
                  {showActionsMenu && (
                    <div className="absolute right-0 top-10 z-20 w-44 rounded-lg border border-blue-100 bg-white p-1">
                      <button type="button" onClick={handleSearchInDiscussion} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-blue-50">Rechercher</button>
                      <button type="button" onClick={handleChangeWallpaper} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-blue-50">Changer le fond</button>
                      <button type="button" onClick={handleToggleLockConversation} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-blue-50">{isActiveLocked ? "Deverrouiller" : "Verrouiller"}</button>
                      <button type="button" onClick={handleOpenClientProfile} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-blue-50">Voir le client</button>
                      <button type="button" onClick={handleArchiveConversation} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-blue-50">Archiver</button>
                      <button type="button" onClick={handleBlockContact} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-red-600 hover:bg-red-50">Bloquer</button>
                      <button type="button" onClick={handleReportContact} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-red-600 hover:bg-red-50">Signaler</button>
                    </div>
                  )}
                </div>
              </header>

              <main className="flex-1 overflow-y-auto bg-blue-50/30 px-4 py-4">
                <div className="mb-1.5 text-right text-[10px] text-slate-400">Today | 05:30 PM</div>

                <div className="flex flex-col gap-3">
                  {allMessages.map((msg) => (
                    <div key={msg.id} className={["flex", msg.from === "me" ? "justify-end" : "justify-start"].join(" ")}>
                      <div
                        className="max-w-[72%] border px-3.5 py-2.5 text-[13px]"
                        style={{
                          borderRadius: msg.from === "me" ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
                          ...(msg.from === "me"
                            ? { background: "var(--ui-status-info-bg)", color: "var(--ui-status-info-text)", borderColor: "var(--ui-border)" }
                            : { background: "var(--ui-card)", color: "var(--ui-text-secondary)", borderColor: "var(--ui-border)" }),
                        }}
                      >
                        <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                        <div
                          className={[
                            "mt-1 flex items-center justify-end gap-1 text-[10px]",
                            msg.from === "me" ? "text-blue-700/80" : "text-slate-400",
                          ].join(" ")}
                        >
                          <span>{msg.time}</span>
                          {msg.from === "me" && <TickMarks status={msg.status} />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </main>

              <footer className="shrink-0 border-t border-blue-100 bg-white px-4 py-3">
                {attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {attachments.map((name) => (
                      <span key={name} className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-medium text-blue-700">
                        {name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-blue-50/40 px-2 py-1.5">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600 transition hover:bg-blue-50"
                      aria-label="Smiley"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                      </svg>
                    </button>

                    {showEmojiPicker && (
                      <div className="absolute bottom-10 left-0 z-20 w-64 rounded-xl border border-blue-100 bg-white p-2">
                        <div className="flex flex-wrap gap-1.5">
                          {["😀", "😂", "😍", "😎", "👍", "🔥", "🙏", "🎉", "💯", "🤝", "🥳", "🙌"].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleAddEmoji(emoji)}
                              className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
                              aria-label={`Ajouter ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type Something..."
                    className="flex-1 rounded-lg border border-transparent bg-transparent px-3 py-2 text-[13px] text-slate-700 outline-none"
                  />

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAttachMenu((prev) => !prev)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600 transition hover:bg-blue-50"
                      aria-label="Menu pieces jointes"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>

                    {showAttachMenu && (
                      <div className="absolute bottom-10 right-0 z-20 w-44 rounded-xl border border-blue-100 bg-white p-1.5">
                        <button type="button" onClick={() => documentsInputRef.current?.click()} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-blue-50">Documents</button>
                        <button type="button" onClick={() => cameraInputRef.current?.click()} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-blue-50">Appareil photo</button>
                        <button type="button" onClick={() => galleryInputRef.current?.click()} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-blue-50">Galerie</button>
                        <button type="button" onClick={handleSendLocation} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-blue-50">Localisation</button>
                        <button type="button" onClick={handleShareContact} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-blue-50">Contact</button>
                        <button type="button" onClick={handleCreatePoll} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-blue-50">Sondage</button>
                      </div>
                    )}
                  </div>

                  <input
                    ref={documentsInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.xlsx"
                    onChange={(event) => addFilesAsAttachments(event.target.files)}
                  />

                  <input
                    ref={galleryInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*,video/*"
                    onChange={(event) => addFilesAsAttachments(event.target.files)}
                  />

                  <input
                    ref={cameraInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,video/*"
                    capture="environment"
                    onChange={(event) => addFilesAsAttachments(event.target.files)}
                  />

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600 transition hover:bg-blue-50"
                    aria-label="Camera"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>

                  <Tooltip content={inputMode === "voice" ? "Mode vocal" : "Mode video"}>
                    <button
                      type="button"
                      onMouseDown={handleMicPressStart}
                      onMouseUp={handleMicPressEnd}
                      onMouseLeave={() => {
                        if (isRecordingVoice) handleMicPressEnd();
                      }}
                      onTouchStart={handleMicPressStart}
                      onTouchEnd={handleMicPressEnd}
                      className={[
                        "w-7 h-7 rounded-full flex items-center justify-center hover:bg-blue-100",
                        isRecordingVoice
                          ? "bg-blue-100 text-blue-700"
                          : "text-slate-500",
                      ].join(" ")}
                      aria-label="Microphone"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    </button>
                  </Tooltip>

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputValue.trim() && attachments.length === 0}
                    className="flex h-9 w-24 items-center justify-center gap-1 rounded-lg bg-blue-700 text-xs font-semibold text-white disabled:opacity-40"
                    aria-label="Envoyer"
                  >
                    <span>Envoyer</span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </footer>

              {showInfoPanel && (
                <div className="absolute inset-0 z-30 pointer-events-none">
                  <button className="absolute inset-0 bg-slate-900/20 pointer-events-auto" onClick={() => setShowInfoPanel(false)} aria-label="Fermer panneau infos" />
                  <aside className="pointer-events-auto absolute right-0 top-0 h-full w-full max-w-xs border-l border-blue-100 bg-white">
                    <div className="flex items-center justify-between border-b border-blue-100 px-4 py-3">
                      <h3 className="text-sm font-semibold text-slate-900">Infos du contact</h3>
                      <button type="button" onClick={() => setShowInfoPanel(false)} className="h-7 w-7 rounded-lg text-blue-500 transition hover:bg-blue-50" aria-label="Fermer">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>

                    <div className="p-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: activeConv.avatarBg, color: activeConv.avatarText }}>
                          {activeConv.initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{activeConv.sender}</p>
                          <p className="text-xs text-slate-500">{activeConv.phone}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Medias partages</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {activeConv.sharedMedia.map((media) => (
                            <span key={media} className="inline-flex rounded-full bg-slate-50 px-2 py-1 text-[10px] text-slate-600">
                              {media}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEphemeralConversationIds((prev) =>
                              isActiveEphemeral ? prev.filter((id) => id !== activeConv.id) : [...prev, activeConv.id]
                            );
                          }}
                          className="w-full rounded-lg border border-blue-100 px-3 py-2 text-left text-xs text-slate-700"
                        >
                          Messages ephemeres: {isActiveEphemeral ? "Actives" : "Desactives"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMutedConversationIds((prev) =>
                              isActiveMuted ? prev.filter((id) => id !== activeConv.id) : [...prev, activeConv.id]
                            );
                          }}
                          className="w-full rounded-lg border border-blue-100 px-3 py-2 text-left text-xs text-slate-700"
                        >
                          Notifications: {isActiveMuted ? "Silence" : "Actives"}
                        </button>
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-slate-500">Selectionnez une conversation</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}







