"use client"

// Derleme zamanında statik olarak oluştur, ancak client tarafında interaktif ve dinamik olarak çalış
export const dynamic = 'force-static'

import type React from "react"


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
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de Bord</h1>
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
