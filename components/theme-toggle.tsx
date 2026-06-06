"use client"

import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg text-muted hover:bg-surface hover:text-fg transition-all duration-300 hover:scale-110"
      aria-label="Toggle theme"
    >
      <span className="block dark:hidden transition-transform duration-500 hover:rotate-45" aria-hidden>☀</span>
      <span className="hidden dark:block transition-transform duration-500 hover:rotate-45" aria-hidden>☾</span>
    </button>
  )
}
