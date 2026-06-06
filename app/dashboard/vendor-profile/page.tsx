"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

const CATEGORIES = ["MATERIALS", "SERVICES", "IT", "CONSULTING", "TRANSPORTATION", "OTHER"] as const

export default function VendorProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [exists, setExists] = useState(false)
  const [form, setForm] = useState({
    companyName: "",
    gstNumber: "",
    email: "",
    phone: "",
    address: "",
    category: "IT",
  })
  const [error, setError] = useState("")

  useEffect(() => {
    async function check() {
      const res = await fetch("/api/vendor-profile")
      const data = await res.json()
      if (data?.profileExists === false) {
        setLoading(false)
        return
      }
      if (data?.id) {
        setExists(true)
        setForm({
          companyName: data.companyName || "",
          gstNumber: data.gstNumber || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          category: data.category || "IT",
        })
      }
      setLoading(false)
    }
    check()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    const res = await fetch("/api/vendor-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json()
      if (typeof data.error === "string") setError(data.error)
      else if (data.error?.fieldErrors) setError(Object.values(data.error.fieldErrors).flat().join(", "))
      else setError("Failed to save profile")
      return
    }

    router.push("/dashboard/quotations")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vendor Profile</h1>
        <p className="text-muted-foreground">
          {exists ? "Your vendor company details" : "Set up your vendor company profile to start submitting quotations"}
        </p>
      </div>

      {exists ? (
        <div className="rounded-lg border p-6 space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span className="font-medium">{form.companyName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">GST</span><span className="font-medium">{form.gstNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{form.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{form.phone}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium">{form.category}</span></div>
          </div>
          <p className="text-sm text-muted-foreground pt-2 border-t">
            Your profile is set up. <a href="/dashboard/quotations/new" className="text-primary hover:underline">Create a quotation</a>
          </p>
        </div>
      ) : (
        <>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-6">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name *</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">GST Number *</label>
              <input
                type="text"
                value={form.gstNumber}
                onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address *</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Profile"}
              </button>
              <button type="button" onClick={() => router.back()} className="text-sm text-muted-foreground hover:underline ml-auto">
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
