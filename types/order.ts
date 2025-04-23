// No Customer import needed if defined inline

export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled"

// Define the structure for items within an order, based on API response
export interface OrderItem {
  itemId: number | string; // Use appropriate type for your item ID
  productId?: number | string; // Ürün ID bilgisi
  quantity: number;
  price: number;
  productName: string;
  image?: string; // Ürün resmi
  unit?: string; // Birim (kg, adet, vb.)
  origin?: string; // Ürünün menşei
}

export interface Order {
  id: string
  createdAt: string
  status: OrderStatus
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
    countryCode: string
    country?: string
    city?: string
    postalCode?: string
    address?: string
    message?: string
  }
  items: OrderItem[]
  total: number
  pickupDate: string
  pickupTime: string
} 