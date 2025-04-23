"use client"

import { useCart } from "@/lib/cart"
import { useOrders } from "@/lib/orders"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import { formatSingleQuantity } from "@/lib/cart"
import { useState, useEffect, useCallback } from "react"
import { toast } from "@/components/ui/use-toast"
import type { CartItem } from '@/types/cart'
import { useDeliveryHours, getAvailableTimeSlots } from '@/lib/delivery-hours'
import { DeliveryForm } from "@/components/delivery-form"
import { format } from "date-fns"
import { API_BASE_URL } from "@/lib/api-config"
import Link from "next/link"
import { ShoppingBasket } from "lucide-react"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, getTotal, clearCart } = useCart()
  const { createOrder } = useOrders()
  const { hours, fetchHours } = useDeliveryHours()
  const [total, setTotal] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>()
  const [showDeliveryForm, setShowDeliveryForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setTotal(getTotal())
  }, [items, getTotal])

  useEffect(() => {
    fetchHours()
  }, [fetchHours])

  const availableTimeSlots = selectedDate ? getAvailableTimeSlots(selectedDate, hours) : []

  const formatQuantity = (item: CartItem) => {
    return formatSingleQuantity(item.unit, item.weight)
  }

  const getItemPrice = (item: CartItem) => {
    return item.price * (item.quantity ?? 1)
  }

  const handleProceedToCheckout = useCallback(() => {
    setShowDeliveryForm(true)
  }, [])

  const handleDeliveryFormSubmit = useCallback(async (data: any) => {
    if (!selectedDate || !selectedTime || items.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une date et une heure de retrait",
        variant: "destructive"
      })
      return
    }
    setIsSubmitting(true)

    const formattedDate = format(selectedDate, "yyyy-MM-dd")
    const deliveryTimeRange = selectedTime

    try {
      await createOrder({
        items: items.map(item => ({
          ...item,
          quantity: item.quantity ?? 1  // quantity undefined ise 1 olarak ayarla
        })),
        total,
        pickupDate: formattedDate,
        pickupTime: deliveryTimeRange,
        customer: data
      })

      toast({
        title: "Commande réussie", 
        description: "Votre commande a été créée avec succès",
        variant: "success"
      })
      clearCart()
      setOrderSuccess(true)

    } catch (error) {
      console.error('Order creation error:', error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de votre commande",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedDate, selectedTime, items, total, clearCart, createOrder])

  if (orderSuccess) {
    return (
      <div className="container py-16 sm:py-24 flex justify-center items-center min-h-[calc(100vh-300px)]">
        <div className="bg-white p-8 sm:p-12 rounded-lg shadow-lg text-center max-w-lg border border-green-200">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-5" />
          <h1 className="text-3xl font-bold mb-3 text-gray-800">Merci pour votre commande !</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Votre commande a été enregistrée avec succès. Nous préparons vos produits frais et vous contacterons bientôt pour confirmer les détails du retrait.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/">Retour à l'accueil</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/products">Continuer vos achats</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 pb-8">
      <h1 className="text-2xl font-bold mb-6 mt-10">Mon panier</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sol taraf - Sepet öğeleri */}
        <div className="md:col-span-2">
          {items.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <ShoppingBasket className="mx-auto h-12 w-12 text-gray-400" />
              <h2 className="mt-2 text-lg font-medium">Votre panier est vide</h2>
              <p className="mt-1 text-sm text-gray-500">
                Commencez à ajouter des produits à votre panier
              </p>
              <Button asChild className="mt-4">
                <Link href="/products">Parcourir les produits</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Articles</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearCart()
                    toast({
                      title: "Panier vidé",
                      description: "Votre panier a été vidé",
                      variant: "orange",
                      duration: 2000,
                    })
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Vider le panier
                </Button>
              </div>
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.name}
                    className="bg-white rounded-lg shadow p-4 flex items-center gap-4"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                      {item.image && (
                        <Image
                          src={item.image.startsWith('data:') 
                            ? item.image 
                            : item.image.startsWith('http') 
                              ? item.image 
                              : item.image.startsWith('/') 
                                ? item.image 
                                : `/${item.image}`
                          }
                          alt={item.name}
                          fill
                          className="object-cover"
                          style={{ objectFit: 'cover' }}
                          onError={(e) => {
                            console.error("Resim yüklenemedi:", item.name);
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium">{item.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-primary font-medium">
                          {getItemPrice(item).toFixed(2)} €
                        </p>
                        <span className="text-sm text-gray-600">({formatQuantity(item)})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.name, Math.max(0, (item.quantity ?? 1) - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity ?? 1}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.name, (item.quantity ?? 1) + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => removeFromCart(item.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sağ taraf - Özet ve teslimat bilgileri */}
        <div className="space-y-4">
          {/* Sipariş özeti */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Résumé de la commande</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total estimé</span>
                <span>{total.toFixed(2)} €</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Le montant final peut varier selon le poids exact
            </p>
          </div>

          {/* Teslimat zamanı seçimi */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Planifier le retrait</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date de retrait</label>
                <DatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  disabled={items.length === 0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Heure de retrait</label>
                <TimePicker
                  value={selectedTime}
                  onChange={setSelectedTime}
                  selectedDate={selectedDate}
                  availableSlots={availableTimeSlots}
                  disabled={!selectedDate || items.length === 0}
                />
              </div>
            </div>
          </div>

          {/* Devam et butonu */}
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-white"
            size="lg"
            disabled={items.length === 0 || !selectedDate || !selectedTime}
            onClick={handleProceedToCheckout}
          >
            Finaliser la commande
          </Button>
        </div>
      </div>

      <DeliveryForm 
        open={showDeliveryForm} 
        onOpenChange={setShowDeliveryForm}
        onSubmit={handleDeliveryFormSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

