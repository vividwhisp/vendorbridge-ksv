"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export interface PieDatum {
  label: string;
  value: number;
}

interface Props {
  data: PieDatum[];
  height?: number;
}

export function PieChartView({ data, height = 240 }: Props) {
  const c1 = getCSSVar("--chart-1");
  const c2 = getCSSVar("--chart-2");
  const c3 = getCSSVar("--chart-3");
  const c4 = getCSSVar("--chart-4");
  const c5 = getCSSVar("--chart-5");
  const palette = [c1, c2, c3, c4, c5];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          stroke="var(--color-bg)"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-fg)",
            fontSize: 12,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "var(--color-muted)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function getCSSVar(name: string): string {
  if (typeof window === "undefined") return "#22c55e";
  return getComputedStyle(document.body).getPropertyValue(name).trim() || "#22c55e";
}
