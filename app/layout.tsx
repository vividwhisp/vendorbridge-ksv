import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LogProvider } from "./lib/log-context";
import { ToastProvider } from "./lib/toast-context";
import { appConfig, getAccentPalette } from "./lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const palette = getAccentPalette(appConfig.accent);
  const accentStyle = {
    "--color-bg": palette.bg,
    "--color-surface": palette.surface,
    "--color-border": palette.border,
    "--color-muted": palette.muted,
    "--color-subtle": palette.subtle,
    "--color-fg": palette.fg,
    "--color-accent": palette.accent,
    "--color-accent-hover": palette.accentHover,
    "--color-danger": palette.danger,
    "--color-low-bg": palette.lowBg,
    "--color-low-border": palette.lowBorder,
    "--color-ok-bg": palette.okBg,
    "--color-ok-border": palette.okBorder,
    "--accent-glow": palette.glow,
    "--accent-rgb": palette.rgb,
    "--danger-rgb": palette.dangerRgb,
    "--chart-1": palette.chart1,
    "--chart-2": palette.chart2,
    "--chart-3": palette.chart3,
    "--chart-4": palette.chart4,
    "--chart-5": palette.chart5,
  } as React.CSSProperties;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-bg text-fg overflow-x-hidden" style={accentStyle}>
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[60vh] opacity-30"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(var(--accent-rgb), 0.4), transparent 70%)" }}
        />
        <ToastProvider>
          <LogProvider>{children}</LogProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
