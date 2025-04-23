"use client"

// Build zamanında statik sayfa için gerekli yapılandırma
// clientModules sorunu nedeniyle kaldırıldı
export const dynamic = 'force-static' 

import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Package, TrendingUp, Users } from "lucide-react"

// Server component olarak yeniden yazıldı
export default function AdminPage() {
  // Doğrudan dashboard sayfasına yönlendir
  redirect('/admin/dashboard')
  
  // Bu kısım hiç çalışmayacak, sadece tip kontrolü için
  return null
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