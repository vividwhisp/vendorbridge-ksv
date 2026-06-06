import { z } from "zod"

export const quotationItemSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0.01, "Unit price must be greater than 0"),
  totalPrice: z.coerce.number().min(0),
})

export const createQuotationSchema = z.object({
  rfqId: z.string().min(1, "Select an RFQ"),
  items: z.array(quotationItemSchema).min(1, "Add at least one item"),
  deliveryDays: z.coerce.number().int().min(1, "Delivery days must be at least 1"),
  remarks: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED"]),
})

export const updateQuotationSchema = z.object({
  items: z.array(quotationItemSchema).min(1, "Add at least one item").optional(),
  deliveryDays: z.coerce.number().int().min(1).optional(),
  remarks: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED"]).optional(),
})

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>
