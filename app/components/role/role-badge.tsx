"use client";

import type { Role } from "../../lib/rbac";
import { ROLE_LABELS } from "../../lib/rbac";

type Props = {
  role: Role;
  size?: "xs" | "sm";
};

const COLOR: Record<Role, { fg: string; bg: string; border: string }> = {
  admin: { fg: "#22d3ee", bg: "rgba(34, 211, 238, 0.08)", border: "rgba(34, 211, 238, 0.3)" },
  user:  { fg: "#7a9a7a", bg: "rgba(122, 154, 122, 0.08)", border: "rgba(122, 154, 122, 0.3)" },
};

export function RoleBadge({ role, size = "sm" }: Props) {
  const c = COLOR[role];
  const padding = size === "xs" ? "px-1.5 py-0" : "px-2 py-0.5";
  const text = size === "xs" ? "text-[9px]" : "text-[10px]";
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wider border ${padding} ${text}`}
      style={{ color: c.fg, backgroundColor: c.bg, borderColor: c.border }}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
