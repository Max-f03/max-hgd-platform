import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

type ClientStatus = "lead" | "active" | "completed";

interface ClientRecord {
	id: string;
	initials: string;
	name: string;
	email: string;
	company: string;
	status: ClientStatus;
	projects: number;
	phone?: string;
	notes?: string;
}

async function resolveActorUserId() {
	const session = await auth();
	if (session?.user?.id) return session.user.id;

	const fallbackUser = await prisma.user.findFirst({
		orderBy: { createdAt: "asc" },
		select: { id: true },
	});

	if (!fallbackUser) {
		throw new Error("Aucun utilisateur disponible.");
	}

	return fallbackUser.id;
}

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "CL";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const includeAll = searchParams.get("includeAll") === "1";
		const userId = includeAll ? null : await resolveActorUserId();
		let clients = await prisma.client.findMany({
			where: userId ? { userId } : undefined,
			orderBy: [{ createdAt: "desc" }],
		});

		if (userId && clients.length === 0) {
			clients = await prisma.client.findMany({
				orderBy: [{ createdAt: "desc" }],
			});
		}

		const data: ClientRecord[] = clients.map((client) => ({
			id: client.id,
			initials: getInitials(client.name),
			name: client.name,
			email: client.email,
			company: client.company ?? "-",
			status: (client.status as ClientStatus) ?? "lead",
			projects: client.totalProjects ?? 0,
			phone: client.phone ?? undefined,
			notes: client.notes ?? undefined,
		}));

		return NextResponse.json({ clients: data });
	} catch {
		return NextResponse.json({ error: "Impossible de charger les clients." }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as Partial<ClientRecord>;
		if (!body.name || !body.email) {
			return NextResponse.json({ error: "Nom et email requis." }, { status: 400 });
		}

		const userId = await resolveActorUserId();
		const created = await prisma.client.create({
			data: {
				name: body.name,
				email: body.email,
				company: body.company ?? null,
				status: body.status ?? "lead",
				phone: body.phone ?? null,
				notes: body.notes ?? null,
				userId,
			},
		});

		const next: ClientRecord = {
			id: created.id,
			initials: getInitials(created.name),
			name: created.name,
			email: created.email,
			company: created.company ?? "-",
			status: (created.status as ClientStatus) ?? "lead",
			projects: 0,
			phone: created.phone ?? undefined,
			notes: created.notes ?? undefined,
		};

		return NextResponse.json({ client: next }, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
	}
}

export async function DELETE(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");
		if (!id) {
			return NextResponse.json({ error: "Parametre id manquant." }, { status: 400 });
		}

		const userId = await resolveActorUserId();
		const existing = await prisma.client.findFirst({
			where: { id, userId },
			select: { id: true },
		});

		if (!existing) {
			return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
		}

		await prisma.client.delete({ where: { id } });

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
	}
}
