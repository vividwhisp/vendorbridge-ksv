import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getQuotations, getPublishedRfqs } from "@/lib/services/quotation.service"
import { canSubmitQuotation } from "@/lib/permissions"
import { QuotationsTable } from "./quotations-table"

export default async function QuotationsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const quotations = await getQuotations(session.user.id, session.user.role)
  const rfqs = canSubmitQuotation(session.user.role) ? await getPublishedRfqs() : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quotations</h1>
          <p className="text-muted-foreground">
            {session.user.role === "VENDOR" ? "Manage your submitted quotations" : "Review vendor quotations"}
          </p>
        </div>
        {canSubmitQuotation(session.user.role) && (
          <Link
            href={rfqs.length === 0 ? "#" : "/dashboard/quotations/new"}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              rfqs.length === 0
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
            aria-disabled={rfqs.length === 0}
            tabIndex={rfqs.length === 0 ? -1 : undefined}
            title={rfqs.length === 0 ? "No published RFQs available" : undefined}
          >
            New Quotation
          </Link>
        )}
      </div>

      {quotations.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No quotations yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {session.user.role === "VENDOR"
              ? "Submit a quotation on a published RFQ to get started."
              : "No quotations have been submitted yet."}
          </p>
          {canSubmitQuotation(session.user.role) && rfqs.length > 0 && (
            <Link href="/dashboard/quotations/new" className="mt-4 inline-flex items-center text-sm text-primary hover:underline">
              Submit your first quotation
            </Link>
          )}
        </div>
      ) : (
        <QuotationsTable quotations={quotations} />
      )}
    </div>
  )
}
