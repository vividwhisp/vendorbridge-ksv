import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DataHub",
  description: "AI-powered data workspace.",
};

const accentStyle = {
  "--color-bg": "#080f08",
  "--color-surface": "#0d1a0d",
  "--color-border": "#162716",
  "--color-muted": "#3a5a3a",
  "--color-subtle": "#7a9a7a",
  "--color-fg": "#e0f0e0",
  "--color-accent": "#22c55e",
  "--color-accent-hover": "#16a34a",
  "--color-danger": "#ef4444",
  "--color-low-bg": "rgba(239, 68, 68, 0.08)",
  "--color-low-border": "rgba(239, 68, 68, 0.25)",
  "--color-ok-bg": "rgba(34, 197, 94, 0.08)",
  "--color-ok-border": "rgba(34, 197, 94, 0.25)",
  "--accent-glow": "rgba(34, 197, 94, 0.5)",
  "--accent-rgb": "34, 197, 94",
  "--danger-rgb": "239, 68, 68",
  "--chart-1": "#22c55e",
  "--chart-2": "#84cc16",
  "--chart-3": "#eab308",
  "--chart-4": "#f59e0b",
  "--chart-5": "#10b981",
} as React.CSSProperties;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      style={accentStyle}
    >
      <body className="min-h-screen bg-bg text-fg overflow-x-hidden">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[60vh] opacity-30"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(var(--accent-rgb), 0.4), transparent 70%)" }}
        />
        {children}
      </body>
    </html>
  );
}
