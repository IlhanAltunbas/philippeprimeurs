"use client"

// Derleme zamanında statik olarak oluştur, ancak client tarafında interaktif ve dinamik olarak çalış
export const dynamic = 'force-static'

import type React from "react"
import { useState, useEffect } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Package, Users, ShoppingBag, Euro } from "lucide-react"

interface AdminStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
}

// Composant client pour l'affichage des statistiques
export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const refreshData = () => {
    fetchStats();
  };

  async function fetchStats() {
    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/admin/stats?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      if (!response.ok) {
        console.error(`Impossible de récupérer les données statistiques: ${response.status}`)
        return
      }

      const data = await response.json()
      console.log('Statistiques récupérées:', data)
      setStats(data)
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      // Si une erreur se produit, nous gardons les valeurs par défaut
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de Bord</h1>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={<Euro className="h-8 w-8 text-blue-600" />}
          title="Ventes Totales" 
          value={`${stats.totalSales.toFixed(2)} €`} 
        />
        <StatCard 
          icon={<ShoppingBag className="h-8 w-8 text-green-600" />}
          title="Commandes" 
          value={stats.totalOrders.toString()} 
        />
        <StatCard 
          icon={<Package className="h-8 w-8 text-yellow-600" />}
          title="Produits" 
          value={stats.totalProducts.toString()} 
        />
        <StatCard 
          icon={<Users className="h-8 w-8 text-purple-600" />}
          title="Clients" 
          value={stats.totalCustomers.toString()} 
        />
      </div>
      {/* Des composants supplémentaires comme des graphiques ou un tableau des dernières commandes peuvent être ajoutés ici */}
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
} 