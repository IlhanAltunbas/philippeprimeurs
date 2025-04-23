export interface CartItem {
  id: string
  name: string
  price: number
  quantity?: number
  image?: string
  unit: string
  weight?: number
  isComposite?: boolean
  contents?: Array<{
    name: string
    quantity: string
    origin?: string
  }>
} 