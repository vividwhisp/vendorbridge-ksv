import { getProvider, type ChatMessage } from "./provider";

export type Result<T> =
  | { ok: true; data: T; raw: string }
  | { ok: false; error: string; raw?: string };

export type ParseFn<T> = (raw: unknown) => T;

export type RunTaskOptions<T> = {
  system: string;
  user: string;
  parse: ParseFn<T>;
  schemaHint?: string;
  retries?: number;
  providerName?: string;
};

const RETRY_BASE_MS = 350;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function stripFences(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    t = t.slice(first, last + 1);
  }
  return t.trim();
}

function safeParse(text: string): unknown | null {
  try {
    return JSON.parse(stripFences(text));
  } catch {
    return null;
  }
}

function buildSystemWithSchema(system: string, hint?: string): string {
  if (!hint) return `${system}\n\nReturn ONLY valid JSON. No prose, no markdown fences.`;
  return `${system}\n\nReturn ONLY valid JSON matching this shape: ${hint}\n\nDo not add prose or markdown fences.`;
}

export async function runTask<T>(opts: RunTaskOptions<T>): Promise<Result<T>> {
  const provider = getProvider();
  const retries = Math.max(0, opts.retries ?? 1);
  const system = buildSystemWithSchema(opts.system, opts.schemaHint);
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: opts.user },
  ];

  let lastRaw = "";
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const raw = await provider.complete(messages);
      lastRaw = raw;
      const parsed = safeParse(raw);
      if (parsed !== null) {
        try {
          const data = opts.parse(parsed);
          return { ok: true, data, raw };
        } catch {
          lastRaw = raw;
        }
      }
    } catch (netErr) {
      if (attempt < retries) {
        await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
        continue;
      }
      return {
        ok: false,
        error: netErr instanceof Error ? netErr.message : "AI request failed",
        raw: lastRaw,
      };
    }

    if (attempt < retries) {
      messages.push({
        role: "user",
        content: `Your previous reply was not valid JSON matching the expected shape. Reply again with ONLY the JSON object, nothing else.`,
      });
      await sleep(RETRY_BASE_MS);
    }
  }

  return {
    ok: false,
    error: "AI returned a response that could not be parsed as the expected JSON.",
    raw: lastRaw,
  };
}

export async function runText(system: string, user: string): Promise<Result<string>> {
  const provider = getProvider();
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  try {
    const raw = await provider.complete(messages);
    return { ok: true, data: raw, raw };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "AI request failed",
    };
  }
}
