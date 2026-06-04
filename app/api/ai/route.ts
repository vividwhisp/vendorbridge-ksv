import { NextResponse } from "next/server";
import {
  summarize,
  classify,
  prioritize,
  recommend,
  extractInsights,
  askAgent,
  type AgentAction,
} from "../../lib/ai";

const TASKS = ["summarize", "classify", "prioritize", "recommend", "extractInsights", "agent"] as const;
type Task = (typeof TASKS)[number];

function isTask(value: unknown): value is Task {
  return typeof value === "string" && (TASKS as readonly string[]).includes(value);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { task } = body;
  if (!isTask(task)) {
    return NextResponse.json(
      { error: `Missing or unknown task. Use one of: ${TASKS.join(", ")}` },
      { status: 400 },
    );
  }

  switch (task) {
    case "summarize": {
      const text = typeof body.text === "string" ? body.text : "";
      if (!text) return NextResponse.json({ error: "Missing 'text'" }, { status: 400 });
      const result = await summarize(text);
      return NextResponse.json(result, { status: result.ok ? 200 : 502 });
    }
    case "classify": {
      const text = typeof body.text === "string" ? body.text : "";
      const categories = body.categories;
      if (!text) return NextResponse.json({ error: "Missing 'text'" }, { status: 400 });
      if (!isStringArray(categories) || categories.length === 0) {
        return NextResponse.json({ error: "Missing or empty 'categories' array" }, { status: 400 });
      }
      const result = await classify(text, categories);
      return NextResponse.json(result, { status: result.ok ? 200 : 502 });
    }
    case "prioritize": {
      const text = typeof body.text === "string" ? body.text : "";
      if (!text) return NextResponse.json({ error: "Missing 'text'" }, { status: 400 });
      const result = await prioritize(text);
      return NextResponse.json(result, { status: result.ok ? 200 : 502 });
    }
    case "recommend": {
      const context = typeof body.context === "string" ? body.context : "";
      if (!context) return NextResponse.json({ error: "Missing 'context'" }, { status: 400 });
      const result = await recommend(context);
      return NextResponse.json(result, { status: result.ok ? 200 : 502 });
    }
    case "extractInsights": {
      const data = body.data;
      if (data === undefined) return NextResponse.json({ error: "Missing 'data'" }, { status: 400 });
      const result = await extractInsights(data);
      return NextResponse.json(result, { status: result.ok ? 200 : 502 });
    }
    case "agent": {
      const opts = body.options as Record<string, unknown> | undefined;
      const user = typeof body.user === "string" ? body.user : "";
      if (!user) return NextResponse.json({ error: "Missing 'user'" }, { status: 400 });
      if (!opts) return NextResponse.json({ error: "Missing 'options'" }, { status: 400 });
      const fields = Array.isArray(opts.fields) ? (opts.fields as { key: string; required?: boolean }[]) : [];
      const result = await askAgent({
        entityName: String(opts.entityName ?? "item"),
        plural: String(opts.plural ?? "items"),
        fields,
        lowStockField: typeof opts.lowStockField === "string" ? opts.lowStockField : undefined,
        lowStockThreshold: typeof opts.lowStockThreshold === "number" ? opts.lowStockThreshold : undefined,
        workflow: Array.isArray(opts.workflow) ? (opts.workflow as string[]) : undefined,
        items: opts.items ?? [],
        user,
      });
      const payload: Record<string, unknown> = { ...result };
      if (result.ok) {
        const safeActions: AgentAction[] = (result.data.actions ?? []).filter(
          (a): a is AgentAction => a !== null && typeof a === "object" && typeof (a as AgentAction).action === "string",
        );
        payload.data = { actions: safeActions, message: result.data.message };
      }
      return NextResponse.json(payload, { status: result.ok ? 200 : 502 });
    }
    default:
      return NextResponse.json({ error: "Unsupported task" }, { status: 400 });
  }
}
