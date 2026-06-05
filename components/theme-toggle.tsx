"use client"

import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg text-muted hover:bg-surface hover:text-fg transition-colors"
      aria-label="Toggle theme"
    >
      <span className="block dark:hidden" aria-hidden>☀</span>
      <span className="hidden dark:block" aria-hidden>☾</span>
    </button>
  )
}
