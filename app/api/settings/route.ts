import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface AccountProfile {
  name: string;
  email: string;
  bio: string;
  site: string;
  location: string;
  avatarUrl: string | null;
}

interface AccountState {
  profile: AccountProfile;
  preferences: {
    emailNotifications: boolean;
    projectUpdates: boolean;
    weeklyReport: boolean;
    language: string;
  };
  passwordUpdatedAt: string | null;
  deleted: boolean;
}

interface SettingsUiSnapshot {
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
    language: string;
  };
  avatarFileName: string;
  activeSection: "profile" | "security" | "preferences" | "danger";
}

interface SettingsVersion {
  id: string;
  name: string;
  savedAt: string;
  isActive: boolean;
  account: AccountState;
  uiState: SettingsUiSnapshot | null;
}

let accountState: AccountState = {
  profile: {
    name: "Max HGD",
    email: "admin@maxhgd.com",
    bio: "Designer & developpeur freelance. Specialise en UX/UI et developpement frontend.",
    site: "",
    location: "Paris, France",
    avatarUrl: null,
  },
  preferences: {
    emailNotifications: true,
    projectUpdates: false,
    weeklyReport: true,
    language: "fr",
  },
  passwordUpdatedAt: null,
  deleted: false,
};

const VERSION_LIMIT = 30;
const DEPLOYMENT_VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  process.env.NEXT_PUBLIC_APP_VERSION ??
  "local-dev";
let accountHydratedFromDb = false;
let persistentVersioningAvailable = true;
let fallbackVersions: SettingsVersion[] = [];

interface ChatbotSettingsPayload {
  chatbotEnabled: boolean;
  chatbotUseAI: boolean;
  chatbotWelcome: string;
  chatbotPersonality: string;
  chatbotPrimaryColor: string;
  chatbotQuickActions: Array<{ label: string; message: string; url?: string }>;
  publicName?: string;
  publicTitle?: string;
  publicEmail?: string;
  publicPhone?: string;
  publicLocation?: string;
  publicAvailability?: string;
}

function cloneAccountState(state: AccountState): AccountState {
  return {
    profile: { ...state.profile },
    preferences: { ...state.preferences },
    passwordUpdatedAt: state.passwordUpdatedAt,
    deleted: state.deleted,
  };
}

function cloneUiState(uiState: SettingsUiSnapshot | null): SettingsUiSnapshot | null {
  if (!uiState) return null;
  return {
    profileForm: { ...uiState.profileForm },
    prefs: { ...uiState.prefs },
    avatarFileName: uiState.avatarFileName,
    activeSection: uiState.activeSection,
  };
}

function buildReadableVersionName(date: Date, sequence: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `v${year}.${month}.${day}-${sequence}`;
}

function toSettingsVersion(row: {
  id: string;
  name: string;
  createdAt: Date;
  isActive: boolean;
  account: unknown;
  uiState: unknown;
}): SettingsVersion {
  return {
    id: row.id,
    name: row.name,
    savedAt: row.createdAt.toISOString(),
    isActive: row.isActive,
    account: cloneAccountState(row.account as unknown as AccountState),
    uiState: cloneUiState((row.uiState as SettingsUiSnapshot | null) ?? null),
  };
}

async function hydrateAccountStateFromActiveVersion() {
  if (accountHydratedFromDb) return;

  try {
    const activeVersion = await prisma.adminVersionHistory.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (activeVersion) {
      accountState = cloneAccountState(activeVersion.account as unknown as AccountState);
    }

    // Charger l'avatar depuis User.avatar si absent de la version active
    if (!accountState.profile.avatarUrl) {
      const adminUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
      if (adminUser?.avatar) {
        accountState.profile.avatarUrl = adminUser.avatar;
      }
    }
  } catch {
    // Keep serving the API even if persistent version storage is not ready.
    persistentVersioningAvailable = false;
  } finally {
    accountHydratedFromDb = true;
  }
}

async function getFirstUserId(): Promise<string | null> {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return user?.id ?? null;
}

function normalizeQuickActions(value: unknown): Array<{ label: string; message: string; url?: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is { label?: unknown; message?: unknown; url?: unknown } =>
        !!item && typeof item === "object"
    )
    .map((item) => ({
      label: typeof item.label === "string" ? item.label : "",
      message: typeof item.message === "string" ? item.message : "",
      ...(typeof item.url === "string" && item.url.trim() ? { url: item.url.trim() } : {}),
    }))
    .filter((item) => item.label.trim().length > 0 || item.message.trim().length > 0);
}

async function getChatbotSettingsSnapshot(): Promise<ChatbotSettingsPayload> {
  const firstUserId = await getFirstUserId();
  if (!firstUserId) {
    return {
      chatbotEnabled: true,
      chatbotUseAI: true,
      chatbotWelcome: "Bonjour ! Je suis l'assistant de Max. Comment puis-je vous aider ?",
      chatbotPersonality: "friendly",
      chatbotPrimaryColor: "#3B82F6",
      chatbotQuickActions: [],
    };
  }

  const settings = await prisma.settings.findUnique({
    where: { userId: firstUserId },
    select: {
      chatbotEnabled: true,
      chatbotUseAI: true,
      chatbotWelcome: true,
      chatbotPersonality: true,
      chatbotPrimaryColor: true,
      chatbotQuickActions: true,
      publicName: true,
      publicTitle: true,
      publicEmail: true,
      publicPhone: true,
      publicLocation: true,
      publicAvailability: true,
    },
  });

  return {
    chatbotEnabled: settings?.chatbotEnabled ?? true,
    chatbotUseAI: settings?.chatbotUseAI ?? true,
    chatbotWelcome:
      settings?.chatbotWelcome ??
      "Bonjour ! Je suis l'assistant de Max. Comment puis-je vous aider ?",
    chatbotPersonality: settings?.chatbotPersonality ?? "friendly",
    chatbotPrimaryColor: settings?.chatbotPrimaryColor ?? "#3B82F6",
    chatbotQuickActions: normalizeQuickActions(settings?.chatbotQuickActions),
    publicName: settings?.publicName ?? undefined,
    publicTitle: settings?.publicTitle ?? undefined,
    publicEmail: settings?.publicEmail ?? undefined,
    publicPhone: settings?.publicPhone ?? undefined,
    publicLocation: settings?.publicLocation ?? undefined,
    publicAvailability: settings?.publicAvailability ?? undefined,
  };
}

async function readVersionsFromDb(): Promise<SettingsVersion[]> {
  if (!persistentVersioningAvailable) {
    return fallbackVersions;
  }

  try {
    const rows = await prisma.adminVersionHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: VERSION_LIMIT,
    });

    return rows.map((row) =>
      toSettingsVersion({
        id: row.id,
        name: row.name,
        createdAt: row.createdAt,
        isActive: row.isActive,
        account: row.account,
        uiState: row.uiState,
      })
    );
  } catch {
    persistentVersioningAvailable = false;
    return fallbackVersions;
  }
}

async function enforceVersionLimit() {
  if (!persistentVersioningAvailable) {
    fallbackVersions = fallbackVersions.slice(0, VERSION_LIMIT);
    return;
  }

  const overflowRows = await prisma.adminVersionHistory.findMany({
    orderBy: { createdAt: "desc" },
    skip: VERSION_LIMIT,
    select: { id: true },
  });

  if (!overflowRows.length) return;

  await prisma.adminVersionHistory.deleteMany({
    where: { id: { in: overflowRows.map((row) => row.id) } },
  });
}

export async function GET(request: Request) {
  await hydrateAccountStateFromActiveVersion();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "export") {
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      account: accountState,
    });
  }

  if (action === "versions") {
    const versions = await readVersionsFromDb();
    return NextResponse.json({ versions });
  }

  if (action === "deploymentStatus") {
    return NextResponse.json({
      latestDeploymentVersion: DEPLOYMENT_VERSION,
      checkedAt: new Date().toISOString(),
    });
  }

  const chatbot = await getChatbotSettingsSnapshot();
  return NextResponse.json({ account: accountState, ...chatbot });
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<ChatbotSettingsPayload>;
    const {
      chatbotEnabled,
      chatbotUseAI,
      chatbotWelcome,
      chatbotPersonality,
      chatbotPrimaryColor,
      chatbotQuickActions,
      publicName,
      publicTitle,
      publicEmail,
      publicPhone,
      publicLocation,
      publicAvailability,
      ...otherFields
    } = body;

    const firstUserId = await getFirstUserId();
    if (!firstUserId) {
      return NextResponse.json({ error: "Aucun utilisateur disponible." }, { status: 400 });
    }

    const payload = {
      ...otherFields,
      chatbotEnabled: chatbotEnabled ?? true,
      chatbotUseAI: chatbotUseAI ?? true,
      chatbotWelcome:
        chatbotWelcome ??
        "Bonjour ! Je suis l'assistant de Max. Comment puis-je vous aider ?",
      chatbotPersonality: chatbotPersonality ?? "friendly",
      chatbotPrimaryColor: chatbotPrimaryColor ?? "#3B82F6",
      chatbotQuickActions: normalizeQuickActions(chatbotQuickActions),
      ...(publicName !== undefined ? { publicName } : {}),
      ...(publicTitle !== undefined ? { publicTitle } : {}),
      ...(publicEmail !== undefined ? { publicEmail } : {}),
      ...(publicPhone !== undefined ? { publicPhone } : {}),
      ...(publicLocation !== undefined ? { publicLocation } : {}),
      ...(publicAvailability !== undefined ? { publicAvailability } : {}),
    };

    await prisma.settings.upsert({
      where: { userId: firstUserId },
      update: payload,
      create: {
        userId: firstUserId,
        ...payload,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Partial<ChatbotSettingsPayload>;

    const firstUserId = await getFirstUserId();
    if (!firstUserId) {
      return NextResponse.json({ error: "Aucun utilisateur disponible." }, { status: 400 });
    }

    const update: {
      chatbotEnabled?: boolean;
      chatbotUseAI?: boolean;
      chatbotWelcome?: string;
      chatbotPersonality?: string;
      chatbotPrimaryColor?: string;
      chatbotQuickActions?: Array<{ label: string; message: string }>;
    } = {};

    if (body.chatbotEnabled !== undefined) update.chatbotEnabled = body.chatbotEnabled;
    if (body.chatbotUseAI !== undefined) update.chatbotUseAI = body.chatbotUseAI;
    if (body.chatbotWelcome !== undefined) update.chatbotWelcome = body.chatbotWelcome;
    if (body.chatbotPersonality !== undefined) update.chatbotPersonality = body.chatbotPersonality;
    if (body.chatbotPrimaryColor !== undefined) update.chatbotPrimaryColor = body.chatbotPrimaryColor;
    if (body.chatbotQuickActions !== undefined) {
      update.chatbotQuickActions = normalizeQuickActions(body.chatbotQuickActions);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Aucun champ a mettre a jour." }, { status: 400 });
    }

    await prisma.settings.upsert({
      where: { userId: firstUserId },
      update,
      create: {
        userId: firstUserId,
        chatbotEnabled: update.chatbotEnabled ?? true,
        chatbotUseAI: update.chatbotUseAI ?? true,
        chatbotWelcome:
          update.chatbotWelcome ??
          "Bonjour ! Je suis l'assistant de Max. Comment puis-je vous aider ?",
        chatbotPersonality: update.chatbotPersonality ?? "friendly",
        chatbotPrimaryColor: update.chatbotPrimaryColor ?? "#3B82F6",
        chatbotQuickActions: update.chatbotQuickActions ?? [],
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    await hydrateAccountStateFromActiveVersion();

    const body = (await request.json()) as {
      action?: string;
      profile?: Pick<AccountProfile, "name" | "email" | "bio" | "site" | "location">;
      preferences?: AccountState["preferences"];
      password?: { current: string; next: string; confirm: string };
      avatarUrl?: string;
      uiState?: SettingsUiSnapshot;
      versionId?: string;
      makeActive?: boolean;
    };

    if (!body.action) {
      return NextResponse.json({ error: "Action manquante." }, { status: 400 });
    }

    if (body.action === "saveProfile") {
      if (!body.profile || !body.profile.name || !body.profile.email) {
        return NextResponse.json({ error: "Nom et email requis." }, { status: 400 });
      }
      accountState = {
        ...accountState,
        profile: {
          ...accountState.profile,
          ...body.profile,
        },
      };
      return NextResponse.json({ success: true, account: accountState });
    }

    if (body.action === "saveAvatar") {
      if (!body.avatarUrl || !body.avatarUrl.startsWith("data:image/")) {
        return NextResponse.json({ error: "Avatar invalide." }, { status: 400 });
      }

      accountState = {
        ...accountState,
        profile: {
          ...accountState.profile,
          avatarUrl: body.avatarUrl,
        },
      };

      // Persister en base pour survivre aux redemarrages
      try {
        const adminUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
        if (adminUser) {
          await prisma.user.update({
            where: { id: adminUser.id },
            data: { avatar: body.avatarUrl },
          });
        }
      } catch {
        // Non bloquant — l'avatar est deja dans accountState
      }

      return NextResponse.json({ success: true, account: accountState });
    }

    if (body.action === "savePreferences") {
      if (!body.preferences) {
        return NextResponse.json({ error: "Preferences manquantes." }, { status: 400 });
      }
      accountState = { ...accountState, preferences: body.preferences };
      return NextResponse.json({ success: true, account: accountState });
    }

    if (body.action === "updatePassword") {
      const password = body.password;
      if (!password || !password.current || !password.next || !password.confirm) {
        return NextResponse.json({ error: "Champs mot de passe invalides." }, { status: 400 });
      }
      if (password.next.length < 8 || password.next !== password.confirm) {
        return NextResponse.json({ error: "Mot de passe invalide." }, { status: 400 });
      }
      accountState = { ...accountState, passwordUpdatedAt: new Date().toISOString() };
      return NextResponse.json({ success: true, account: accountState });
    }

    if (body.action === "deleteAccount") {
      accountState = { ...accountState, deleted: true };
      return NextResponse.json({ success: true, account: accountState });
    }

    if (body.action === "createVersion") {
      try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
        const todayCount = persistentVersioningAvailable
          ? await prisma.adminVersionHistory.count({
              where: {
                createdAt: {
                  gte: startOfDay,
                  lt: endOfDay,
                },
              },
            })
          : fallbackVersions.filter((version) => version.savedAt.startsWith(now.toISOString().slice(0, 10))).length;

        const versionName = buildReadableVersionName(now, todayCount + 1);
        const shouldMarkActive = body.makeActive ?? true;

        if (!persistentVersioningAvailable) {
          if (shouldMarkActive) {
            fallbackVersions = fallbackVersions.map((version) => ({ ...version, isActive: false }));
          }

          const fallbackVersion: SettingsVersion = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: versionName,
            savedAt: now.toISOString(),
            isActive: shouldMarkActive,
            account: cloneAccountState(accountState),
            uiState: cloneUiState(body.uiState ?? null),
          };

          fallbackVersions = [fallbackVersion, ...fallbackVersions].slice(0, VERSION_LIMIT);
          return NextResponse.json({ success: true, version: fallbackVersion, storage: "memory" });
        }

        if (shouldMarkActive) {
          await prisma.adminVersionHistory.updateMany({ data: { isActive: false } });
        }

        const createdVersion = await prisma.adminVersionHistory.create({
          data: {
            name: versionName,
            isActive: shouldMarkActive,
            account: cloneAccountState(accountState) as unknown as Prisma.InputJsonValue,
            uiState: cloneUiState(body.uiState ?? null) as unknown as Prisma.InputJsonValue,
          },
        });

        await enforceVersionLimit();

        const version = toSettingsVersion({
          id: createdVersion.id,
          name: createdVersion.name,
          createdAt: createdVersion.createdAt,
          isActive: createdVersion.isActive,
          account: createdVersion.account,
          uiState: createdVersion.uiState,
        });

        return NextResponse.json({ success: true, version });
      } catch {
        persistentVersioningAvailable = false;
        return NextResponse.json({ error: "Versioning indisponible temporairement." }, { status: 503 });
      }
    }

    if (body.action === "restoreVersion") {
      if (!body.versionId) {
        return NextResponse.json({ error: "versionId manquant." }, { status: 400 });
      }

      if (!persistentVersioningAvailable) {
        const selectedVersion = fallbackVersions.find((item) => item.id === body.versionId);
        if (!selectedVersion) {
          return NextResponse.json({ error: "Version introuvable." }, { status: 404 });
        }

        accountState = cloneAccountState(selectedVersion.account);
        fallbackVersions = fallbackVersions.map((item) => ({
          ...item,
          isActive: item.id === selectedVersion.id,
        }));

        const version = fallbackVersions.find((item) => item.id === selectedVersion.id) ?? selectedVersion;
        return NextResponse.json({ success: true, version, storage: "memory" });
      }

      const selectedVersion = await prisma.adminVersionHistory.findUnique({
        where: { id: body.versionId },
      });

      if (!selectedVersion) {
        return NextResponse.json({ error: "Version introuvable." }, { status: 404 });
      }

      accountState = cloneAccountState(selectedVersion.account as unknown as AccountState);

      await prisma.$transaction([
        prisma.adminVersionHistory.updateMany({ data: { isActive: false } }),
        prisma.adminVersionHistory.update({ where: { id: selectedVersion.id }, data: { isActive: true } }),
      ]);

      const refreshedVersion = await prisma.adminVersionHistory.findUnique({
        where: { id: selectedVersion.id },
      });

      if (!refreshedVersion) {
        return NextResponse.json({ error: "Version introuvable." }, { status: 404 });
      }

      const version = toSettingsVersion({
        id: refreshedVersion.id,
        name: refreshedVersion.name,
        createdAt: refreshedVersion.createdAt,
        isActive: refreshedVersion.isActive,
        account: refreshedVersion.account,
        uiState: refreshedVersion.uiState,
      });

      return NextResponse.json({ success: true, version });
    }

    return NextResponse.json({ error: "Action non supportee." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
  }
}
