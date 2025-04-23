"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

// useSearchParams için bir sarmalayıcı bileşen oluştur
function AdminLoginContent() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated, checkAuth } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Sayfa yüklendiğinde auth durumunu kontrol et
  useEffect(() => {
    const checkAuthStatus = async () => {
      const isAuth = checkAuth()
      if (isAuth) {
        const from = searchParams.get('from') || '/admin/categories'
        router.push(from)
      }
    }
    
    checkAuthStatus()
  }, [checkAuth, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login(username, password)
      
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté",
        variant: "success",
        duration: 3000,
      })
      
      // Başarılı giriş sonrası doğrudan yönlendir
      const from = searchParams.get('from') || '/admin/categories'
      router.push(from)
    } catch (error) {
      console.error("Login failed:", error)
      toast({
        title: "Erreur",
        description: "Identifiants incorrects",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Admin Panel
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <Input
              type="text"
              placeholder="Kullanıcı Adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
            <Input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
        </form>
      </div>
    </div>
  )
}

// Ana sayfa bileşeni, artık Suspense ile sarmalanmış
export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="text-center text-3xl font-bold text-gray-900">
              Admin Panel
            </h2>
            <p className="text-center mt-4">Chargement en cours...</p>
          </div>
        </div>
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  )
} 