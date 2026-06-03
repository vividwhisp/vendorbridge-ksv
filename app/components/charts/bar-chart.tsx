"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

export interface BarDatum {
  label: string;
  value: number;
}

interface Props {
  data: BarDatum[];
  height?: number;
  color?: string;
  horizontal?: boolean;
}

export function BarChartView({ data, height = 240, color, horizontal }: Props) {
  const c1 = getCSSVar("--chart-1");
  const c2 = getCSSVar("--chart-2");
  const c3 = getCSSVar("--chart-3");
  const c4 = getCSSVar("--chart-4");
  const c5 = getCSSVar("--chart-5");
  const palette = [c1, c2, c3, c4, c5];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
        {horizontal ? (
          <>
            <XAxis type="number" stroke="var(--color-muted)" tick={{ fill: "var(--color-muted)", fontSize: 12 }} />
            <YAxis type="category" dataKey="label" stroke="var(--color-muted)" tick={{ fill: "var(--color-muted)", fontSize: 12 }} width={80} />
          </>
        ) : (
          <>
            <XAxis dataKey="label" stroke="var(--color-muted)" tick={{ fill: "var(--color-muted)", fontSize: 12 }} />
            <YAxis stroke="var(--color-muted)" tick={{ fill: "var(--color-muted)", fontSize: 12 }} />
          </>
        )}
        <Tooltip
          contentStyle={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-fg)",
            fontSize: 12,
          }}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={color ?? palette[i % palette.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function getCSSVar(name: string): string {
  if (typeof window === "undefined") return "#22c55e";
  return getComputedStyle(document.body).getPropertyValue(name).trim() || "#22c55e";
}
