"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getChartPalette } from "./css-var";

export interface PieDatum {
  label: string;
  value: number;
}

interface Props {
  data: PieDatum[];
  height?: number;
}

export function PieChartView({ data, height = 240 }: Props) {
  const palette = getChartPalette();

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
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted)" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
