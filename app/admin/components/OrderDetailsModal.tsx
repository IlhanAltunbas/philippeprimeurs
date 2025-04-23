import { useState, useEffect } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Image from "next/image"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Tag, Calendar, Clock, User, Mail, Phone, MapPin, MessageSquare, ShoppingBag } from "lucide-react"
import { useOrders } from "@/lib/orders"
import { Order, OrderItem, OrderStatus } from "@/types/order"
import { API_BASE_URL, getImageUrl } from "@/lib/api-config"


interface OrderDetailsModalProps {
  orderId: string | null
  isOpen: boolean
  onClose: () => void
}

// Sipariş durumu renk ve etiketleri
const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const statusLabels = {
  pending: "En attente",
  confirmed: "Confirmée",
  completed: "Terminée",
  cancelled: "Annulée",
}

export default function OrderDetailsModal({ orderId, isOpen, onClose }: OrderDetailsModalProps) {
  const [orderDetails, setOrderDetails] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { fetchOrderDetails } = useOrders()

  useEffect(() => {
    if (isOpen && orderId) {
      let isStillMounted = true
      setLoading(true)
      setError(null)
      setOrderDetails(null)

      fetchOrderDetails(orderId)
        .then(data => {
          if (isStillMounted) {
            setOrderDetails(data)
            setLoading(false)
          }
        })
        .catch(err => {
          if (isStillMounted) {
            setError(err.message || "Failed to fetch order details")
            setLoading(false)
          }
        })

      return () => {
        isStillMounted = false
      }
    } else {
      setOrderDetails(null)
      setError(null)
      setLoading(false)
    }
  }, [isOpen, orderId, fetchOrderDetails])

  if (!isOpen) return null

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  // Ürün resim URL'sini alma yardımcı fonksiyonu
  const getProductImageUrl = (item: OrderItem) => {
    if (!item.image) return "/placeholder.svg";
    
    if (item.image.startsWith('data:') || item.image.startsWith('http')) {
      return item.image;
    }
    
    // Lokal resimler için doğru URL'yi oluştur
    return item.image.startsWith('/') ? item.image : `/${item.image}`;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> 
            Détails de la Commande #{orderId}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">
            Erreur: {error}
          </div>
        ) : orderDetails ? (
          <div className="space-y-6">
            {/* Sipariş Başlık Kartı */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Commande #{orderDetails.id}</h2>
                  <div className="flex items-center gap-4 text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(orderDetails.createdAt), "Pp", { locale: fr })}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={statusColors[orderDetails.status as keyof typeof statusColors]}
                    >
                      {statusLabels[orderDetails.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {typeof orderDetails.total === 'number' 
                    ? orderDetails.total.toFixed(2) 
                    : Number(orderDetails.total).toFixed(2)} €
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sipariş Bilgileri */}
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5" /> Informations de Commande
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Date de retrait</p>
                      <p className="text-gray-600">{format(new Date(orderDetails.pickupDate), "P", { locale: fr })}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Heure de retrait</p>
                      <p className="text-gray-600">{orderDetails.pickupTime}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Müşteri Bilgileri */}
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" /> Informations Client
                </h3>
                
                {orderDetails.customer ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Nom</p>
                        <p className="text-gray-600">
                          {orderDetails.customer.firstName || '-'} {orderDetails.customer.lastName || ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-gray-600">
                          {orderDetails.customer.email ? 
                            <a href={`mailto:${orderDetails.customer.email}`} className="hover:underline text-blue-600">
                              {orderDetails.customer.email}
                            </a> 
                            : '-'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Téléphone</p>
                        <p className="text-gray-600">
                          {orderDetails.customer.phone ? 
                            <a href={`tel:${orderDetails.customer.countryCode}${orderDetails.customer.phone}`} className="hover:underline text-blue-600">
                              {orderDetails.customer.countryCode || ''} {orderDetails.customer.phone}
                            </a> 
                            : '-'}
                        </p>
                      </div>
                    </div>
                    
                    {(orderDetails.customer.address || orderDetails.customer.city) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium">Adresse</p>
                          <p className="text-gray-600">
                            {orderDetails.customer.address ? `${orderDetails.customer.address}, ` : ''}
                            {orderDetails.customer.city ? `${orderDetails.customer.city} ` : ''}
                            {orderDetails.customer.postalCode ? `${orderDetails.customer.postalCode}, ` : ''}
                            {orderDetails.customer.country || ''}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {orderDetails.customer.message && (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium">Message</p>
                          <p className="text-gray-600 p-2 bg-gray-50 rounded border mt-1">{orderDetails.customer.message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded text-center">
                    <p className="text-gray-500">Aucune information client disponible</p>
                    <p className="text-sm text-gray-400 mt-1">Les données client ne sont pas associées à cette commande</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sipariş Öğeleri */}
            <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
              <h3 className="font-semibold text-gray-700 p-6 border-b flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" /> Produits Commandés
              </h3>
              
              <div className="p-6">
                <div className="grid gap-4">
                  {orderDetails.items.map((item: OrderItem) => (
                    <div key={item.itemId} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 relative rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                        <Image
                          src={getImageUrl(item.image)}
                          alt={item.productName}
                          fill
                          sizes="64px"
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <h4 className="font-medium truncate">{item.productName}</h4>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div>Quantité: {item.quantity} {item.unit || 'pièce'}</div>
                          {item.origin && (
                            <div>Origine: {item.origin}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-medium text-primary">{item.price.toFixed(2)} €/{item.unit || 'pièce'}</div>
                        <div className="text-sm text-gray-500">
                          Total: {(item.price * item.quantity).toFixed(2)} €
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t flex justify-end">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total de la commande</div>
                    <div className="text-2xl font-bold text-primary">
                      {typeof orderDetails.total === 'number' 
                        ? orderDetails.total.toFixed(2) 
                        : Number(orderDetails.total).toFixed(2)} €
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            Aucune information disponible
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
