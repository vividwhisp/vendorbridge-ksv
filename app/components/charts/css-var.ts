export function getCSSVar(name: string): string {
  if (typeof window === "undefined") return "#22c55e";
  return getComputedStyle(document.body).getPropertyValue(name).trim() || "#22c55e";
}

export function getChartPalette(): string[] {
  return [
    getCSSVar("--chart-1"),
    getCSSVar("--chart-2"),
    getCSSVar("--chart-3"),
    getCSSVar("--chart-4"),
    getCSSVar("--chart-5"),
  ];
}
