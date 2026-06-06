"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { createRfqSchema, type CreateRfqInput } from "@/features/rfq/schemas/rfq-schema"

export function RfqForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState("")

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateRfqInput>({
    defaultValues: {
      title: "",
      description: "",
      deadline: "",
      items: [{ productName: "", quantity: 1, specification: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "items" })

  async function onSubmit(data: CreateRfqInput) {
    const parsed = createRfqSchema.safeParse(data)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".")
        if (path) {
          setError(path as keyof CreateRfqInput, { message: issue.message })
        }
      }
      return
    }

    setServerError("")
    const res = await fetch("/api/rfqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    })

    if (!res.ok) {
      const err = await res.json()
      setServerError(err.error ?? "Something went wrong")
      return
    }

    const rfq = await res.json()
    router.push(`/dashboard/rfqs/${rfq.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {serverError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-fg mb-1.5">
            Title <span className="text-danger">*</span>
          </label>
          <input
            id="title"
            {...register("title")}
            placeholder="e.g. Laptop Procurement Q4"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
          />
          {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-fg mb-1.5">
            Description <span className="text-danger">*</span>
          </label>
          <textarea
            id="description"
            {...register("description")}
            rows={4}
            placeholder="Describe what you're looking for..."
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none resize-vertical"
          />
          {errors.description && <p className="mt-1 text-xs text-danger">{errors.description.message}</p>}
        </div>

        <div>
          <label htmlFor="deadline" className="block text-sm font-medium text-fg mb-1.5">
            Deadline <span className="text-danger">*</span>
          </label>
          <input
            id="deadline"
            type="date"
            {...register("deadline")}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-fg focus:border-accent focus:outline-none"
          />
          {errors.deadline && <p className="mt-1 text-xs text-danger">{errors.deadline.message}</p>}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-fg">
            RFQ Items <span className="text-danger">*</span>
          </h3>
          <button
            type="button"
            onClick={() => append({ productName: "", quantity: 1, specification: "" })}
            className="text-sm text-accent hover:underline"
          >
            + Add Item
          </button>
        </div>

        {errors.items?.root && <p className="mb-2 text-xs text-danger">{errors.items.root.message}</p>}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted">Item #{index + 1}</span>
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(index)} className="text-xs text-danger hover:underline">
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Product Name <span className="text-danger">*</span>
                  </label>
                  <input
                    {...register(`items.${index}.productName`)}
                    placeholder="e.g. MacBook Pro"
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
                  />
                  {errors.items?.[index]?.productName && (
                    <p className="mt-0.5 text-xs text-danger">{errors.items[index]?.productName?.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Quantity <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="mt-0.5 text-xs text-danger">{errors.items[index]?.quantity?.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Specification
                  </label>
                  <input
                    {...register(`items.${index}.specification`)}
                    placeholder="e.g. 16GB RAM, 512GB SSD"
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-bg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create RFQ"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted hover:text-fg hover:bg-surface transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
