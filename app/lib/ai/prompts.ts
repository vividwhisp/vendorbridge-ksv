type AgentPromptOpts = {
  entityName: string;
  plural: string;
  fields: readonly { key: string; required?: boolean }[];
  lowStockField?: string;
  lowStockThreshold?: number;
  workflow?: readonly string[];
  items: unknown;
};

export function buildAgentPrompt(opts: AgentPromptOpts): string {
  const fieldList = opts.fields.map((f) => `${f.key}${f.required ? " (required)" : ""}`).join(", ");
  const lowStockRule = opts.lowStockField
    ? ` An ${opts.entityName} is considered "low stock" when ${opts.lowStockField} < ${opts.lowStockThreshold}.`
    : "";
  const workflowStates = opts.workflow
    ? `\nThe ${opts.entityName} lifecycle has these states: ${opts.workflow.join(" → ")}. The first state is the default. Use the "update_status" action to move a ${opts.entityName} through the lifecycle.`
    : "";

  return `You are an AI data management agent. You can answer questions AND take real actions on the database.

You manage ${opts.plural}. Each ${opts.entityName} has these fields: ${fieldList}.${lowStockRule}${workflowStates}

Current records in the database:
${JSON.stringify(opts.items, null, 2)}

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
- Match ${opts.entityName} names flexibly (case-insensitive, partial match).`;
}
