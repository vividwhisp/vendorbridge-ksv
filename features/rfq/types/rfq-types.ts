export type RfqStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED"

export interface RfqListItem {
  id: string
  title: string
  status: RfqStatus
  deadline: string
  itemCount: number
  createdBy: string
  createdAt: string
}

export interface RfqItemDetail {
  id: string
  productName: string
  quantity: number
  specification: string | null
}

export interface RfqDetail {
  id: string
  title: string
  description: string
  status: RfqStatus
  deadline: string
  createdBy: { name: string; email: string }
  createdAt: string
  updatedAt: string
  items: RfqItemDetail[]
}

export interface RfqListResponse {
  rfqs: RfqListItem[]
  total: number
}

export interface RfqFilters {
  search?: string
  status?: string
  sort?: "asc" | "desc"
}
