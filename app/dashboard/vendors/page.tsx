import Link from "next/link"

export default function VendorsPage() {
  return (
    <div className="px-responsive py-responsive space-y-6 min-h-[calc(100vh-3.5rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-xl md:text-2xl font-semibold text-fg">Vendors</h1>
          <p className="text-sm text-muted mt-0.5">Manage all vendor profiles and information</p>
        </div>
        <Link
          href="/dashboard/vendor-profile"
          className="inline-flex items-center justify-center sm:justify-start gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-accent-hover transition-colors whitespace-nowrap"
        >
          + Add Vendor
        </Link>
      </div>

      {/* Placeholder for vendors list - will be populated with vendor data */}
      <div className="table-responsive-wrapper">
        <table className="w-full text-sm">
          <thead className="bg-surface border-b border-border">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left font-semibold text-fg">Vendor Name</th>
              <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left font-semibold text-fg">Email</th>
              <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left font-semibold text-fg">Status</th>
              <th className="px-4 sm:px-6 py-3 text-right font-semibold text-fg">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border hover:bg-surface/50 transition-colors">
              <td className="px-4 sm:px-6 py-3 text-fg">No vendors yet</td>
              <td className="hidden sm:table-cell px-4 sm:px-6 py-3 text-muted">-</td>
              <td className="hidden md:table-cell px-4 sm:px-6 py-3 text-muted">-</td>
              <td className="px-4 sm:px-6 py-3 text-right text-muted">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}