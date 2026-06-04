"use client";

import type { TableConfig } from "../../lib/config";
import { getStateColor, formatStateLabel } from "../../lib/workflow";

type Props = {
  state: string;
  table: TableConfig;
};

export function StatusBadge({ state, table }: Props) {
  if (!state) return null;
  const color = getStateColor(state, table);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border"
      style={{
        color,
        backgroundColor: `${color}1A`,
        borderColor: `${color}40`,
      }}
    >
      {formatStateLabel(state)}
    </span>
  );
}
