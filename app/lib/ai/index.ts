import { buildAgentPrompt } from "./prompts";
import { runTask, type Result } from "./run";
import { getProvider, setProvider, type AIProvider, type ChatMessage } from "./provider";

export type { AIProvider, ChatMessage };
export { getProvider, setProvider };

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

function asString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return "";
  return String(v);
}

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
