export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type AIProvider = {
  name: string;
  complete(messages: ChatMessage[]): Promise<string>;
};

function openRouterProvider(): AIProvider {
  const apiKey = process.env.OPENROUTER_API_KEY ?? "";
  const model = process.env.OPENROUTER_MODEL ?? "openrouter/free";
  const referer = process.env.OPENROUTER_REFERER ?? "http://localhost:3000";
  const title = process.env.OPENROUTER_TITLE ?? "DataHub";

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
    async complete(): Promise<string> {
      return JSON.stringify({ actions: [], message: "Mock agent reply (set OPENROUTER_API_KEY to use a real model)" });
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
