import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-fg">
            <span className="flex size-7 items-center justify-center rounded-md bg-accent text-bg text-xs font-bold">V</span>
            VendorBriddge
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-medium text-bg hover:bg-accent-hover transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-24 pb-16 text-center">
          <span className="inline-block rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted mb-6">
            Next.js 16 + Prisma + PostgreSQL
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-fg mb-4">
            Build data-driven apps
            <br />
            <span className="text-accent">in record time</span>
          </h1>
          <p className="mx-auto max-w-lg text-base text-muted mb-8">
            A modern full-stack starter with SQLite, Prisma, and a clean interface.
            Ready to deploy with Docker.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-lg bg-accent px-5 text-sm font-medium text-bg hover:bg-accent-hover transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-lg border border-border bg-bg px-5 text-sm font-medium text-fg hover:bg-surface transition-colors"
            >
              Learn more
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "SQLite", desc: "Reliable, ACID-compliant relational database for your data." },
              { title: "Prisma ORM", desc: "Type-safe auto-generated queries with full IntelliSense." },
              { title: "Tailwind CSS", desc: "Utility-first styling with a clean, responsive design." },
              { title: "Theme System", desc: "Light and dark modes with system preference detection." },
              { title: "Responsive", desc: "Mobile-first layout that works on every screen size." },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-muted"
              >
                <h3 className="font-semibold text-fg mb-1">{card.title}</h3>
                <p className="text-sm text-muted">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6">
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
