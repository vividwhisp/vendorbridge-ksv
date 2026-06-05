export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-fg">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Welcome to your dashboard. Phase 1 is ready.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Users", value: "—" },
          { label: "Active Sessions", value: "—" },
          { label: "Data Points", value: "—" },
          { label: "Uptime", value: "—" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="text-2xl font-bold text-fg mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-semibold text-fg mb-2">Getting Started</h2>
        <p className="text-sm text-muted">
          This is Phase 1 — the foundation is set. Future phases will add
          authentication, CRUD operations, and business logic.
        </p>
      </div>
    </div>
  )
}
