export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type AIProvider = {
  name: string;
  complete(messages: ChatMessage[]): Promise<string>;
};

function readEnv(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v && v.length > 0) return v;
  if (fallback !== undefined) return fallback;
  return "";
}

function openRouterProvider(): AIProvider {
  const apiKey = readEnv("OPENROUTER_API_KEY");
  const model = readEnv("OPENROUTER_MODEL", "openrouter/free");
  const referer = readEnv("OPENROUTER_REFERER", "http://localhost:3000");
  const title = readEnv("OPENROUTER_TITLE", "DataHub");

  return {
    name: `openrouter:${model}`,
    async complete(messages: ChatMessage[]): Promise<string> {
      if (!apiKey) {
        throw new Error("Missing OPENROUTER_API_KEY in .env.local");
      }
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": referer,
          "X-Title": title,
        },
        body: JSON.stringify({ model, messages }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`OpenRouter ${response.status}: ${text || response.statusText}`);
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return data.choices?.[0]?.message?.content ?? "";
    },
  };
}

function mockProvider(): AIProvider {
  return {
    name: "mock",
    async complete(messages: ChatMessage[]): Promise<string> {
      const last = messages[messages.length - 1]?.content ?? "";
      if (last.includes("summarize")) {
        return JSON.stringify({ summary: "Mock summary: " + last.slice(0, 60) });
      }
      if (last.includes("classifier")) {
        return JSON.stringify({ category: null, confidence: 0 });
      }
      if (last.includes("triaging")) {
        return JSON.stringify({ priority: "medium", reason: "Mock priority" });
      }
      if (last.includes("recommendation engine")) {
        return JSON.stringify({ recommendations: [] });
      }
      if (last.includes("data analyst")) {
        return JSON.stringify({ insights: [] });
      }
      return JSON.stringify({ actions: [], message: "Mock agent reply" });
    },
  };
}

let active: AIProvider | null = null;

export function getProvider(): AIProvider {
  if (active) return active;
  if (process.env.AI_PROVIDER === "mock" || !process.env.OPENROUTER_API_KEY) {
    active = mockProvider();
  } else {
    active = openRouterProvider();
  }
  return active;
}

export function setProvider(provider: AIProvider) {
  active = provider;
}
