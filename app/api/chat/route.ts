import { NextResponse } from "next/server";
import { getProvider, type ChatMessage } from "../../lib/ai/provider";

type IncomingMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function POST(request: Request) {
  let body: { system?: string; messages?: IncomingMessage[] };
  try {
    body = (await request.json()) as { system?: string; messages?: IncomingMessage[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.system || !body.messages?.length) {
    return NextResponse.json(
      { error: "Request must include system and messages." },
      { status: 400 },
    );
  }

  const messages: ChatMessage[] = [
    { role: "system", content: body.system },
    ...body.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const provider = getProvider();
    const reply = await provider.complete(messages);
    return NextResponse.json({ message: reply });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 502 },
    );
  }
}
