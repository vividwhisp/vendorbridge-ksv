import { z } from "zod"

export const rfqItemSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  specification: z.string().optional(),
})

export const createRfqSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  deadline: z.string().min(1, "Deadline is required"),
  items: z.array(rfqItemSchema).min(1, "At least one item is required"),
})

export type CreateRfqInput = z.infer<typeof createRfqSchema>
export type RfqItemInput = z.infer<typeof rfqItemSchema>
