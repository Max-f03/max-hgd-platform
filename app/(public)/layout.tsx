import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/chatbot/ChatWidget";
import prisma from "@/lib/prisma";

interface QuickAction {
  label: string;
  message: string;
  url?: string;
}

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { label: "Voir les projets", message: "Je voudrais voir vos projets" },
  { label: "Services", message: "Quels services proposez-vous ?" },
  { label: "Me contacter", message: "Je voudrais vous contacter" },
];

async function getChatbotSettings() {
  try {
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!user) return null;

    return await prisma.settings.findUnique({
      where: { userId: user.id },
      select: {
        chatbotEnabled: true,
        chatbotName: true,
        chatbotWelcome: true,
        chatbotPrimaryColor: true,
        chatbotQuickActions: true,
      },
    });
  } catch {
    return null;
  }
}

function parseQuickActions(raw: unknown): QuickAction[] {
  if (!Array.isArray(raw)) return DEFAULT_QUICK_ACTIONS;
  const parsed = raw
    .filter((item): item is { label?: unknown; message?: unknown; url?: unknown } => !!item && typeof item === "object")
    .map((item) => ({
      label: typeof item.label === "string" ? item.label : "",
      message: typeof item.message === "string" ? item.message : "",
      ...(typeof item.url === "string" && item.url.trim() ? { url: item.url.trim() } : {}),
    }))
    .filter((item) => item.label.length > 0);
  return parsed.length > 0 ? parsed : DEFAULT_QUICK_ACTIONS;
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getChatbotSettings();

  const enabled = settings?.chatbotEnabled ?? true;
  const botName = settings?.chatbotName ?? "Assistant";
  const welcomeMessage =
    settings?.chatbotWelcome ??
    "Bonjour ! Je suis l'assistant de Max. Comment puis-je vous aider ?";
  const primaryColor = settings?.chatbotPrimaryColor ?? "#3B82F6";
  const quickActions = parseQuickActions(settings?.chatbotQuickActions);

  return (
    <div className="landing-light min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900" data-force-light="true">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget
        enabled={enabled}
        botName={botName}
        welcomeMessage={welcomeMessage}
        primaryColor={primaryColor}
        quickActions={quickActions}
      />
    </div>
  );
}
