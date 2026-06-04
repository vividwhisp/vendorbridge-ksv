import type { TableConfig } from "./config";
import { getChartPalette } from "../components/charts/css-var";

export type WorkflowState = string;

export function hasWorkflow(table: TableConfig): boolean {
  return Array.isArray(table.workflow) && table.workflow.length > 0;
}

export function getDefaultState(table: TableConfig): WorkflowState | undefined {
  if (!hasWorkflow(table)) return undefined;
  return table.workflow![0];
}

export function getStateIndex(state: WorkflowState, table: TableConfig): number {
  if (!hasWorkflow(table)) return -1;
  return table.workflow!.indexOf(state);
}

export function getStateColor(state: WorkflowState, table: TableConfig): string {
  const idx = getStateIndex(state, table);
  if (idx < 0) return getChartPalette()[0];
  return getChartPalette()[idx % getChartPalette().length];
}

export function validateState(
  state: unknown,
  table: TableConfig,
): { ok: true; value: WorkflowState } | { ok: false; reason: string } {
  if (!hasWorkflow(table)) return { ok: true, value: String(state ?? "") };
  if (state === undefined || state === null || state === "") {
    return { ok: true, value: getDefaultState(table)! };
  }
  if (typeof state !== "string") {
    return { ok: false, reason: "status must be a string" };
  }
  if (!table.workflow!.includes(state)) {
    return {
      ok: false,
      reason: `status must be one of: ${table.workflow!.join(", ")}`,
    };
  }
  return { ok: true, value: state };
}

export function formatStateLabel(state: WorkflowState): string {
  if (!state) return "";
  return state
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function countByState(
  items: readonly Record<string, unknown>[],
  table: TableConfig,
): Record<WorkflowState, number> {
  const counts: Record<string, number> = {};
  if (!hasWorkflow(table)) return counts as Record<WorkflowState, number>;
  for (const state of table.workflow!) counts[state] = 0;
  for (const item of items) {
    const state = String(item.status ?? "");
    if (state in counts) counts[state] += 1;
  }
  return counts as Record<WorkflowState, number>;
}
