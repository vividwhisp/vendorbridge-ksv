import Link from "next/link"
import { RfqForm } from "@/features/rfq/components/rfq-form"

export default function NewRfqPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link href="/dashboard/rfqs" className="hover:text-accent transition-colors">RFQs</Link>
        <span>/</span>
        <span className="text-fg">New RFQ</span>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-fg">Create RFQ</h1>
        <p className="text-sm text-muted mt-0.5">Fill in the details to create a new request for quotation</p>
      </div>

      <div className="max-w-2xl">
        <RfqForm />
      </div>
    </div>
  )
}
