import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden">
      {/* Gradient background with dark theme */}
      <div className="fixed inset-0 -z-10">
        {/* Light mode background */}
        <div className="absolute inset-0 light bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100" />
        {/* Dark mode background */}
        <div className="absolute inset-0 dark bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />
      </div>
      
      {/* Animated background orbs */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl bg-animate-orb -z-10" />
      <div className="fixed top-1/2 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl bg-animate-orb-alt -z-10" />
      <div className="fixed bottom-20 left-1/3 w-80 h-80 bg-accent/5 rounded-full blur-3xl bg-animate-orb -z-10" style={{ animationDelay: "2s" }} />
      
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur animate-slide-in-down">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-fg hover:text-accent transition-colors">
            <span className="flex size-7 items-center justify-center rounded-md bg-accent text-bg text-xs font-bold">VB</span>
            Vendor Bridge
          </Link>
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-medium text-bg hover:bg-accent-hover transition-colors duration-300"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-24 pb-16 text-center">
          <span className="inline-block rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted mb-6 animate-fade-in">
            Connecting Vendors, Buyers & ERP Operations in One Smart Platform
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-fg mb-4 animate-slide-in-up">
            Transform Procurement
            <br />
            <span className="text-accent">With Automation</span>
          </h1>
          <p className="mx-auto max-w-lg text-base text-muted mb-8 animate-slide-in-up" style={{ animationDelay: "0.1s" }}>
            Connect vendors, automate approvals, compare quotations, and simplify procurement workflows with Vendor Bridge.
          </p>
          <div className="flex items-center justify-center gap-3 animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-lg bg-accent px-5 text-sm font-medium text-bg hover:bg-accent-hover hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Get started
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-lg border border-border bg-bg px-5 text-sm font-medium text-fg hover:bg-surface hover:border-accent transition-all duration-300"
            >
              Learn more
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Vendor Onboarding", desc: "Register, verify, and manage vendors through a centralized digital process." },
              { title: "Quotation Management", desc: "Collect, organize, and compare quotations from multiple vendors efficiently." },
              { title: "Approval Workflow", desc: "Automate procurement approvals with configurable multi-level workflows." },
              { title: "Vendor Performance", desc: "Track vendor reliability, delivery history, and overall performance metrics." },
              { title: "Real-Time Notifications", desc: "Keep vendors and procurement teams informed with instant status updates." },
              { title: "Ai Integration", desc: "Seamlessly connect procurement operations with the Ai  ERP ecosystem." }
            ].map((card, index) => (
              <div
                key={card.title}
                className="group rounded-xl border border-border bg-surface/40 backdrop-blur-sm p-6 transition-all duration-300 hover:border-accent/50 hover-card-lift animate-card-entrance"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative">
                  <h3 className="font-semibold text-fg mb-2 text-lg">{card.title}</h3>
                  <p className="text-sm text-muted group-hover:text-muted transition-colors duration-300">{card.desc}</p>
                  {/* Accent line on hover */}
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-accent to-accent/0 group-hover:w-full transition-all duration-300" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 bg-bg/50 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} VendorBridge
          </p>
          <nav className="flex gap-4 text-sm text-muted">
            <Link href="/dashboard" className="hover:text-fg transition-colors">
              Dashboard
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
