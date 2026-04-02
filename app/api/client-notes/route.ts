import { NextResponse } from "next/server";

const notesByClient: Record<string, string> = {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json({ error: "Parametre clientId manquant." }, { status: 400 });
  }

  return NextResponse.json({ notes: notesByClient[clientId] ?? "" });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { clientId?: string; notes?: string };
    if (!body.clientId) {
      return NextResponse.json({ error: "Parametre clientId manquant." }, { status: 400 });
    }

    notesByClient[body.clientId] = body.notes ?? "";
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
  }
}
