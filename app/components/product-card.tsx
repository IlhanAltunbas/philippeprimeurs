interface ProductCardProps {
  name: string
  price: number
  image?: string
  type?: string
  quantity?: string
  origin?: string
}

export default function ProductCard({
  name,
  price,
  image = "/placeholder.svg",
  type = "",
  quantity = "",
  origin = ""
}: ProductCardProps) {
  // ...
} 