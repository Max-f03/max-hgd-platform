import { NextRequest, NextResponse } from "next/server";

// POST - LLM config is intentionally disabled for now.
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      provider?: "none" | "openai" | "anthropic";
      model?: string;
    };
    const { provider, model } = body;

    if (!provider || !["openai", "anthropic", "none"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    if (provider !== "none") {
      return NextResponse.json(
        {
          error: "LLM integration is disabled. Use provider 'none' for now.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        provider: "none",
        model: model ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[chatbot:llm-config:post] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde de la configuration LLM" },
      { status: 500 }
    );
  }
}

// GET - Retrieve LLM configuration
export async function GET() {
  try {
    return NextResponse.json(
      {
        provider: "none",
        model: null,
        hasApiKey: false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[chatbot:llm-config:get] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation de la configuration" },
      { status: 500 }
    );
  }
}
