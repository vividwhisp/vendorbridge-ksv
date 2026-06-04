export const PROMPTS = {
  summarize: (text: string) =>
    `You are a concise summarizer. Return JSON: { "summary": "<= 3 sentences" }.\n\nTEXT:\n${text}`,

  classify: (text: string, categories: readonly string[]) =>
    `You are a strict text classifier. Pick the single best category from the list.\n` +
    `Return JSON: { "category": "<one of the categories>", "confidence": <0..1> }.\n` +
    `If none fit, return { "category": null, "confidence": 0 }.\n\n` +
    `CATEGORIES: ${JSON.stringify(categories)}\n\nTEXT:\n${text}`,

  prioritize: (text: string) =>
    `You are a triaging assistant. Assign a priority and a short reason.\n` +
    `Return JSON: { "priority": "low" | "medium" | "high" | "urgent", "reason": "<= 1 sentence" }.\n\n` +
    `ITEM:\n${text}`,

  recommend: (context: string) =>
    `You are a recommendation engine. Given the context, return up to 5 ranked suggestions.\n` +
    `Return JSON: { "recommendations": [ { "title": string, "reason": string, "score": 0..1 } ] }.\n\n` +
    `CONTEXT:\n${context}`,

  extractInsights: (data: unknown) =>
    `You are a data analyst. Given a JSON dataset, extract the top 5 non-obvious insights.\n` +
    `Return JSON: { "insights": [ { "headline": string, "detail": string, "importance": 0..1 } ] }.\n\n` +
    `DATA:\n${JSON.stringify(data, null, 2)}`,

  agent: (params: {
    entityName: string;
    plural: string;
    fieldList: string;
    lowStockRule: string;
    workflowStates: string;
    itemsJson: string;
  }) => `You are an AI data management agent. You can answer questions AND take real actions on the database.

You manage ${params.plural}. Each ${params.entityName} has these fields: ${params.fieldList}.${params.lowStockRule}${params.workflowStates}

Current records in the database:
${params.itemsJson}

CRITICAL: You must ALWAYS respond with valid JSON only in this exact format. No extra text, no markdown, no backticks.

{
  "actions": [
    { "action": "update_stock", "productId": <id>, "newQuantity": <number> },
    { "action": "delete_item", "productId": <id> },
    { "action": "add_item", "<field_key>": <value>, ... },
    { "action": "update_status", "productId": <id>, "newStatus": "<one of the workflow states>" }
  ],
  "message": "<your short response to the user>"
}

RULES:
- The "actions" array can have MULTIPLE actions or be empty for queries.
- The "message" field is what you say to the user (keep it under 2 sentences).
- For "update_stock": "newQuantity" is the FINAL absolute quantity (not a delta).
- For "delete_item": only productId is needed.
- For "add_item": include the required fields and any sensible defaults.
- For "update_status": "newStatus" MUST be one of the workflow states listed above.
- For "query": return an empty actions array and put the answer in "message".
- Match ${params.entityName} names flexibly (case-insensitive, partial match).`,
};

export function buildAgentPrompt(opts: {
  entityName: string;
  plural: string;
  fields: readonly { key: string; required?: boolean }[];
  lowStockField?: string;
  lowStockThreshold?: number;
  workflow?: readonly string[];
  items: unknown;
}): string {
  const fieldList = opts.fields.map((f) => `${f.key}${f.required ? " (required)" : ""}`).join(", ");
  const lowStockRule = opts.lowStockField
    ? ` An ${opts.entityName} is considered "low stock" when ${opts.lowStockField} < ${opts.lowStockThreshold}.`
    : "";
  const workflowStates = opts.workflow
    ? `\nThe ${opts.entityName} lifecycle has these states: ${opts.workflow.join(" → ")}. The first state is the default. Use the "update_status" action to move a ${opts.entityName} through the lifecycle.`
    : "";
  return PROMPTS.agent({
    entityName: opts.entityName,
    plural: opts.plural,
    fieldList,
    lowStockRule,
    workflowStates,
    itemsJson: JSON.stringify(opts.items, null, 2),
  });
}
