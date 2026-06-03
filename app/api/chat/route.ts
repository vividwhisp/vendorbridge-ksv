import { NextResponse } from "next/server";
import { requireEnv } from "@/app/lib/env";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function POST(request: Request) {
  const apiKey = requireEnv("OPENROUTER_API_KEY");
  const model = requireEnv("OPENROUTER_MODEL");

  if (!apiKey || !model) {
    return NextResponse.json(
      { error: "Missing OPENROUTER_API_KEY or OPENROUTER_MODEL" },
      { status: 500 },
    );
  }

  const { messages, system } = await request.json() as {
    messages?: ChatMessage[];
    system?: string;
  };

  if (!system || !messages?.length) {
    return NextResponse.json(
      { error: "Request must include system and messages." },
      { status: 400 },
    );
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Inventory Manager",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: system,
        },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();

    return NextResponse.json(
      { error: error || "OpenRouter request failed." },
      { status: response.status },
    );
  }

  const data = await response.json();

  return NextResponse.json({
    message: data.choices?.[0]?.message?.content ?? "",
  });
}
