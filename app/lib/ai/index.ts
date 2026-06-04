import { PROMPTS, buildAgentPrompt } from "./prompts";
import { runTask, runText, type Result } from "./run";
import { getProvider, setProvider, type AIProvider, type ChatMessage } from "./provider";

export type { AIProvider, ChatMessage };
export { getProvider, setProvider };

export type SummarizeResult = { summary: string };
export type ClassifyResult = { category: string | null; confidence: number };
export type PrioritizeResult = { priority: "low" | "medium" | "high" | "urgent"; reason: string };
export type RecommendItem = { title: string; reason: string; score: number };
export type RecommendResult = { recommendations: RecommendItem[] };
export type Insight = { headline: string; detail: string; importance: number };
export type ExtractInsightsResult = { insights: Insight[] };

export type AgentAction = {
  action: "update_stock" | "delete_item" | "add_item" | "update_status" | "query";
  productId?: number;
  newQuantity?: number;
  newStatus?: string;
  [key: string]: unknown;
};

export type AgentResult = {
  actions: AgentAction[];
  message: string;
};

function asString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return "";
  return String(v);
}

function asNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function summarize(text: string): Promise<Result<SummarizeResult>> {
  return runTask<SummarizeResult>({
    system: PROMPTS.summarize(text),
    user: "Summarize the text above.",
    schemaHint: '{ "summary": string }',
    parse: (raw) => ({ summary: asString((raw as SummarizeResult).summary) }),
  });
}

export async function classify(
  text: string,
  categories: readonly string[],
): Promise<Result<ClassifyResult>> {
  return runTask<ClassifyResult>({
    system: PROMPTS.classify(text, categories),
    user: "Classify the text above.",
    schemaHint: '{ "category": string|null, "confidence": number }',
    parse: (raw) => {
      const r = raw as ClassifyResult;
      return {
        category: r.category === null ? null : asString(r.category),
        confidence: asNumber(r.confidence, 0),
      };
    },
  });
}

export async function prioritize(text: string): Promise<Result<PrioritizeResult>> {
  return runTask<PrioritizeResult>({
    system: PROMPTS.prioritize(text),
    user: "Prioritize the item above.",
    schemaHint: '{ "priority": "low"|"medium"|"high"|"urgent", "reason": string }',
    parse: (raw) => {
      const r = raw as PrioritizeResult;
      const allowed = ["low", "medium", "high", "urgent"] as const;
      const p = (allowed as readonly string[]).includes(r.priority) ? r.priority : "medium";
      return { priority: p as PrioritizeResult["priority"], reason: asString(r.reason) };
    },
  });
}

export async function recommend(context: string): Promise<Result<RecommendResult>> {
  return runTask<RecommendResult>({
    system: PROMPTS.recommend(context),
    user: "Recommend based on the context above.",
    schemaHint: '{ "recommendations": [ { "title": string, "reason": string, "score": number } ] }',
    parse: (raw) => {
      const r = raw as RecommendResult;
      const list = Array.isArray(r.recommendations) ? r.recommendations : [];
      return {
        recommendations: list.slice(0, 5).map((it) => ({
          title: asString(it.title),
          reason: asString(it.reason),
          score: asNumber(it.score, 0),
        })),
      };
    },
  });
}

export async function extractInsights(data: unknown): Promise<Result<ExtractInsightsResult>> {
  return runTask<ExtractInsightsResult>({
    system: PROMPTS.extractInsights(data),
    user: "Extract insights from the data above.",
    schemaHint: '{ "insights": [ { "headline": string, "detail": string, "importance": number } ] }',
    parse: (raw) => {
      const r = raw as ExtractInsightsResult;
      const list = Array.isArray(r.insights) ? r.insights : [];
      return {
        insights: list.slice(0, 5).map((it) => ({
          headline: asString(it.headline),
          detail: asString(it.detail),
          importance: asNumber(it.importance, 0),
        })),
      };
    },
  });
}

export type AgentOptions = {
  entityName: string;
  plural: string;
  fields: readonly { key: string; required?: boolean }[];
  lowStockField?: string;
  lowStockThreshold?: number;
  workflow?: readonly string[];
  items: unknown;
  user: string;
};

export async function askAgent(opts: AgentOptions): Promise<Result<AgentResult>> {
  const system = buildAgentPrompt(opts);
  return runTask<AgentResult>({
    system,
    user: opts.user,
    schemaHint: '{ "actions": AgentAction[], "message": string }',
    parse: (raw) => {
      const r = raw as Partial<AgentResult>;
      return {
        actions: Array.isArray(r.actions) ? (r.actions as AgentAction[]) : [],
        message: asString(r.message),
      };
    },
  });
}

export async function runPlainText(
  system: string,
  user: string,
): Promise<Result<string>> {
  return runText(system, user);
}
