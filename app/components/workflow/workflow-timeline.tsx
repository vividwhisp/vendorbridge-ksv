"use client";

import { useMemo } from "react";
import type { TableConfig } from "../../lib/config";
import { getStateColor, getStateIndex, formatStateLabel } from "../../lib/workflow";

type Props = {
  state: string;
  table: TableConfig;
};

export function WorkflowTimeline({ state, table }: Props) {
  const states = table.workflow;
  const currentIdx = getStateIndex(state, table);

  const colors = useMemo(
    () => (states ?? []).map((s) => getStateColor(s, table)),
    [states, table],
  );

  if (!states || states.length === 0) return null;

  if (!states || states.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {states.map((s, i) => {
        const isCurrent = i === currentIdx;
        const isPast = currentIdx >= 0 && i < currentIdx;
        const c = colors[i] ?? "#22c55e";
        return (
          <div key={s} className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-center min-w-[64px]">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors"
                style={
                  isCurrent
                    ? { backgroundColor: c, borderColor: c, color: "#0b0b0b" }
                    : isPast
                      ? { backgroundColor: `${c}33`, borderColor: c, color: c }
                      : { backgroundColor: "transparent", borderColor: "var(--border, #2a2a2a)", color: "var(--muted, #888)" }
                }
              >
                {isPast ? "✓" : i + 1}
              </div>
              <span
                className="mt-1 text-[10px] uppercase tracking-wide"
                style={{ color: isCurrent ? c : "var(--muted, #888)" }}
              >
                {formatStateLabel(s)}
              </span>
            </div>
            {i < states.length - 1 && (
              <div
                className="h-px w-6"
                style={{
                  backgroundColor: isPast ? c : "var(--border, #2a2a2a)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
