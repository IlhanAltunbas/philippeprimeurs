import { create } from "zustand"
import { Order, OrderStatus, OrderItem } from "@/types/order"
import { toast } from "@/components/ui/use-toast"

// Flask API için mutlak URL kullanımı
// export const API_BASE_URL = 'http://localhost:8000';

// NextJS API için göreceli URL kullanımı
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

interface OrderStore {
  orders: Order[]
  isLoading: boolean
  error: string | null
  currentOrder: Order | null
  fetchOrders: () => Promise<void>
  fetchOrderDetails: (orderId: string) => Promise<Order>
  createOrder: (
    orderData: Omit<Order, "id" | "createdAt" | "status" | "items"> & { items: Omit<OrderItem, 'itemId' | 'productName'>[], turnstileToken: string }
  ) => Promise<void>
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>
  deleteOrder: (orderId: string) => Promise<void>
}

// Helper to include Authorization header if token exists
const getAuthHeaders = () => {
  const authStateString = localStorage.getItem('auth-storage'); // Use the correct key
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (authStateString) {
    try {
      const authState = JSON.parse(authStateString);
      // Access the token within the state object
      const token = authState?.state?.token; 
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        // console.log("Token not found within authState.state"); // Optional: for debugging
      }
    } catch (error) {
      console.error("Error parsing auth state from localStorage:", error);
    }
  } else {
      // console.log("auth-storage not found in localStorage"); // Optional: for debugging
  }
  return headers;
};

export const useOrders = create<OrderStore>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,
  currentOrder: null,

  fetchOrders: async () => {
    try {
      set({ isLoading: true, error: null })
      // NextJS API rotasını kullan
      const response = await fetch(`/api/admin/orders`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur lors de la récupération des commandes" }))
        throw new Error(errorData.error || "Erreur lors de la récupération des commandes")
      }
      let data: Order[] = await response.json()
      
      // Total değerinin sayı olduğundan emin olalım
      data = data.map(order => ({
        ...order,
        total: typeof order.total === 'number' ? order.total : Number(order.total)
      }))
      
      set({ orders: data })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue"
      set({ error: errorMessage })
      toast({
        title: "Erreur",
        description: `Impossible de charger les commandes: ${errorMessage}`,
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchOrderDetails: async (orderId: string) => {
    try {
      // NextJS API rotasını kullan
      const response = await fetch(`/api/admin/orders/${orderId}`, {
         headers: getAuthHeaders(),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur lors de la récupération des détails" }))
        throw new Error(errorData.error || "Erreur lors de la récupération des détails de la commande")
      }
      
      const data = await response.json()
      
      // Total değerinin sayı olduğundan emin olalım
      data.total = typeof data.total === 'number' ? data.total : Number(data.total)
      
      // Verify and enhance the items array to include image information
      if (data.items && Array.isArray(data.items)) {
        data.items = data.items.map((item: any) => ({
          ...item,
          // Ensure image property exists, even if null/undefined
          image: item.image || null,
          // Ensure price is a number
          price: typeof item.price === 'number' ? item.price : Number(item.price)
        }));
      }
      
      // Müşteri bilgilerinin uygun şekilde ayarlandığından emin olalım
      // API'dan customer: null gelir veya hiç customer alanı olmazsa, boş bir nesne oluştur
      if (!data.customer) {
        data.customer = {
          id: null,
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          countryCode: "",
          address: "",
          city: "",
          country: "",
          postalCode: "",
          message: ""
        };
      } else {
        // Müşteri bilgisi varsa ama eksik alanlar varsa, bunları boş string ile doldur
        data.customer = {
          id: data.customer.id || null,
          firstName: data.customer.firstName || "",
          lastName: data.customer.lastName || "",
          email: data.customer.email || "",
          phone: data.customer.phone || "",
          countryCode: data.customer.countryCode || "",
          address: data.customer.address || "", 
          city: data.customer.city || "",
          country: data.customer.country || "",
          postalCode: data.customer.postalCode || "",
          message: data.customer.message || "",
        };
      }
      
      set({ currentOrder: data, error: null })
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue"
      set({ error: errorMessage }) // Clear loading state on error
      toast({
        title: "Erreur",
        description: `Impossible de charger les détails: ${errorMessage}`,
        variant: "destructive",
        duration: 3000,
      })
      throw error
    }
  },

  createOrder: async (orderData) => {
    // turnstileToken'ı orderData'dan ayır
    const { turnstileToken, ...restOfOrderData } = orderData;
    try {
      set({ isLoading: true, error: null })
      
      const response = await fetch(`/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // İstek gövdesine token'ı da ekle
        body: JSON.stringify({ ...restOfOrderData, turnstileToken }), 
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur lors de la création de la commande" }))
        throw new Error(errorData.error || "Erreur lors de la création de la commande")
      }

      const result = await response.json()
      // Fetch orders again to reflect the new order
      await get().fetchOrders()

      toast({
        title: "Succès",
        description: "Votre commande a été créée avec succès",
      })
      // Email sending should be handled by the Flask backend now

    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue"
      set({ error: errorMessage })
      toast({
        title: "Erreur",
        description: `Impossible de créer la commande: ${errorMessage}`,
        variant: "destructive",
        duration: 3000,
      })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    try {
      // NextJS API rotasını kullan
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Durum güncellenirken bir hata oluştu" }))
        throw new Error(errorData.error || `Sipariş durumu güncellenirken hata: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Durum güncellemesi başarılı, güncel order durumunu store'a ekle
      get().fetchOrders() // Sipariş listesini yenile
      
      // Eğer detayları görüntülüyorsak, o detayları da güncelle
      const currentOrder = get().currentOrder
      if (currentOrder && currentOrder.id === orderId) {
        set(state => ({
          currentOrder: {
            ...currentOrder,
            status: status
          }
        }))
      }
      
      toast({
        title: "Başarılı",
        description: "Sipariş durumu güncellendi",
        duration: 3000,
      })
      
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Sipariş durumu güncellenirken bir hata oluştu"
      set({ error: errorMessage })
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      })
      throw error
    }
  },

  deleteOrder: async (orderId: string): Promise<void> => {
    try {
      set({ isLoading: true, error: null })
      // Auth headers alın
      const headers = getAuthHeaders()
      
      // NextJS API rotasını kullan
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
        headers: headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Sipariş silinirken bir hata oluştu" }))
        throw new Error(errorData.error || "Sipariş silinirken bir hata oluştu")
      }

      // Siparişi yerel state'den kaldır
      set((state) => ({
        orders: state.orders.filter((order) => order.id !== orderId),
        currentOrder: state.currentOrder?.id === orderId ? null : state.currentOrder,
      }))

      toast({
        title: "Başarılı",
        description: "Sipariş başarıyla silindi",
        duration: 3000,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Sipariş silinirken bir hata oluştu"
      set({ error: errorMessage })
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      set({ isLoading: false })
    }
  },
})) 