"use client";

import { useState, useTransition } from "react";
import type { TableConfig } from "../../lib/config";
import type { Row } from "../../types";
import { apiUpdate } from "../../lib/api-helper";
import { useToast } from "../../lib/toast-context";
import { getStateColor } from "../../lib/workflow";

type Props = {
  item: Row;
  table: TableConfig;
  onUpdated?: (next: Row) => void;
};

export function StatusDropdown({ item, table, onUpdated }: Props) {
  const states = table.workflow ?? [];
  const currentState = String(item.status ?? states[0] ?? "");
  const [value, setValue] = useState(currentState);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const id = Number(item.id);

  if (states.length === 0) return null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    if (next === value) return;
    const prev = value;
    setValue(next);
    startTransition(async () => {
      try {
        const updated = await apiUpdate(table.id, id, { status: next });
        onUpdated?.(updated);
      } catch (err) {
        setValue(prev);
        const msg = err instanceof Error ? err.message : "Status update failed";
        showToast(msg, "error");
      }
    });
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={isPending}
      className="text-xs rounded-md px-2 py-1 border outline-none cursor-pointer disabled:opacity-50"
      style={{
        color: getStateColor(value, table),
        borderColor: `${getStateColor(value, table)}40`,
        backgroundColor: `${getStateColor(value, table)}10`,
      }}
    >
      {states.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
