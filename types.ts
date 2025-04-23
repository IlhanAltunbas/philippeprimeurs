export interface Product {
  id: number
  name: string
  price: number
  image: string | null
  category?: {
    id: number
    name: string
  }
  quantity: number
  unit: string
  origin: string
  isActive: boolean
  isComposite: boolean
  contents?: {
    id: number
    productId: number
    name: string
    quantity: number
    unit: string
  }[]
}

export interface PaginationData {
  total: number
  page: number
  limit: number
  totalPages: number
} 