"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useOrders } from "@/lib/orders"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, Trash2, AlertCircle, Eraser, RefreshCw } from "lucide-react"
import OrderDetailsModal from "../../components/OrderDetailsModal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"

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

export default function OrdersPage() {
  const { orders, isLoading, error, fetchOrders, updateOrderStatus, deleteOrder } = useOrders()
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchOrders()
      toast({
        title: "Başarılı",
        description: "Siparişler yenilendi",
        duration: 3000,
      })
    } catch (error) {
      console.error("Siparişler yenilenirken hata oluştu:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleViewDetails = (event: React.MouseEvent, orderId: string) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("Sipariş detayları görüntüleniyor, ID:", orderId);
    
    // Eğer modal zaten açıksa ve aynı sipariş ID'sine sahipse, bir şey yapma
    if (isDetailsModalOpen && selectedOrderId === orderId) {
      return;
    }
    
    setSelectedOrderId(orderId);
    setIsDetailsModalOpen(true);
  }

  const handleCloseDetailsModal = () => {
    console.log("Sipariş detayları modalı kapatılıyor");
    setIsDetailsModalOpen(false);
    setSelectedOrderId(null);
  }

  const handleDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (orderToDelete) {
      try {
        await deleteOrder(orderToDelete)
      } catch (error) {
        console.error("Sipariş silinirken hata:", error)
      } finally {
        setIsDeleteDialogOpen(false)
        setOrderToDelete(null)
      }
    }
  }

  const handleDeleteCompletedAndCancelled = () => {
    setIsBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    try {
      const completedAndCancelledOrders = orders.filter(
        order => order.status === 'completed' || order.status === 'cancelled'
      )
      
      if (completedAndCancelledOrders.length === 0) {
        toast({
          title: "Information",
          description: "Aucune commande terminée ou annulée à supprimer.",
          duration: 3000,
        })
        setIsBulkDeleteDialogOpen(false)
        return
      }
      
      let deletedCount = 0
      for (const order of completedAndCancelledOrders) {
        try {
          await deleteOrder(order.id)
          deletedCount++
        } catch (error) {
          console.error(`Sipariş silinirken hata (ID: ${order.id}):`, error)
        }
      }
      
      toast({
        title: "Succès",
        description: `${deletedCount} commandes terminées et annulées ont été supprimées.`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Toplu sipariş silme işlemi sırasında hata:", error)
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la suppression des commandes.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsBulkDeleteDialogOpen(false)
    }
  }

  if (isLoading && !isRefreshing) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">Une erreur est survenue lors du chargement des commandes</p>
      </div>
    )
  }

  // Tamamlanmış ve iptal edilmiş sipariş sayısını hesapla
  const completedAndCancelledCount = orders.filter(
    order => order.status === 'completed' || order.status === 'cancelled'
  ).length

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Commandes</h1>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
          onClick={handleDeleteCompletedAndCancelled}
          disabled={completedAndCancelledCount === 0}
        >
          <Eraser className="h-4 w-4" />
          Supprimer les commandes terminées et annulées
          {completedAndCancelledCount > 0 && (
            <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800">
              {completedAndCancelledCount}
            </Badge>
          )}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Retrait</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    {order.createdAt && !isNaN(new Date(order.createdAt).getTime())
                      ? format(new Date(order.createdAt), "Pp", { locale: fr })
                      : "Date inconnue"}
                  </TableCell>
                  <TableCell>
                    <div>
                      {order.customer?.firstName || 'Sans nom'} {order.customer?.lastName || ''}
                      <div className="text-sm text-gray-500">{order.customer?.email || "Pas d'e-mail"}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {order.pickupDate && !isNaN(new Date(order.pickupDate).getTime())
                        ? format(new Date(order.pickupDate), "P", { locale: fr })
                        : "Date inconnue"}
                      <div className="text-sm text-gray-500">{order.pickupTime || "Heure inconnue"}</div>
                    </div>
                  </TableCell>
                  <TableCell>{order.total.toFixed(2)} €</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusColors[order.status as keyof typeof statusColors]}
                    >
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value as any)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Changer le statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="confirmed">Confirmée</SelectItem>
                          <SelectItem value="completed">Terminée</SelectItem>
                          <SelectItem value="cancelled">Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        type="button"
                        onClick={(e) => handleViewDetails(e, order.id)}
                        title="Voir les détails"
                        disabled={isDetailsModalOpen && selectedOrderId === order.id}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteOrder(order.id)}
                        title="Supprimer la commande"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Sipariş Detay Modalı */}
      <OrderDetailsModal
        orderId={selectedOrderId}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
      />

      {/* Silme Onay Dialogu */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette commande?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données de la commande seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toplu Silme Onay Dialogu */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer toutes les commandes terminées et annulées?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les commandes terminées et annulées seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-red-500 hover:bg-red-600">
              Supprimer tout ({completedAndCancelledCount})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

