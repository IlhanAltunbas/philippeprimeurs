"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDeliveryHours, updateDeliveryHours } from "@/lib/delivery-hours"
import { RefreshCw } from "lucide-react"

// Saat seçenekleri için yardımcı fonksiyon
function generateTimeOptions() {
  const times = []
  for (let hour = 7; hour <= 22; hour++) {
    for (let minute of ["00", "30"]) {
      times.push(`${hour.toString().padStart(2, "0")}:${minute}`)
    }
  }
  return times
}

export default function DeliveryHours() {
  const { hours, isLoading, error, fetchHours, updateHours } = useDeliveryHours()
  const [localHours, setLocalHours] = useState(hours)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const timeOptions = generateTimeOptions()

  // Force refresh function to always get fresh data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await fetchHours()
      toast({
        title: "Succès",
        description: "Les horaires ont été actualisées",
        duration: 3000,
      })
    } catch (error) {
      console.error('Erreur de rafraîchissement:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les horaires",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchHours])

  useEffect(() => {
    fetchHours()
    
    // Also set up an interval to refresh data periodically
    const interval = setInterval(() => {
      fetchHours()
    }, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [fetchHours])

  useEffect(() => {
    setLocalHours(hours)
  }, [hours])

  const handleToggleDay = (dayOfWeek: number) => {
    setLocalHours(localHours.map(hour => 
      hour.day_of_week === dayOfWeek ? { ...hour, is_open: !hour.is_open } : hour
    ))
  }

  const handleToggleMorning = (dayOfWeek: number) => {
    setLocalHours(localHours.map(hour => 
      hour.day_of_week === dayOfWeek ? { ...hour, morning_enabled: !hour.morning_enabled } : hour
    ))
  }

  const handleToggleAfternoon = (dayOfWeek: number) => {
    setLocalHours(localHours.map(hour => 
      hour.day_of_week === dayOfWeek ? { ...hour, afternoon_enabled: !hour.afternoon_enabled } : hour
    ))
  }

  const handleTimeChange = (dayOfWeek: number, field: string, value: string) => {
    setLocalHours(localHours.map(hour => 
      hour.day_of_week === dayOfWeek ? { ...hour, [field]: value } : hour
    ))
  }

  const handleSave = async () => {
    try {
      await updateDeliveryHours(localHours)
      toast({
        title: "Succès",
        description: "Les horaires ont été mises à jour",
        duration: 3000,
      })
      
      // Force refresh to get the latest data from the server
      setTimeout(() => {
        refreshData()
      }, 500)
    } catch (error) {
      console.error('Erreur de mise à jour des horaires:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les horaires",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  if (isLoading && !isRefreshing) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 mb-4">Erreur: {error}</div>
        <Button onClick={refreshData} disabled={isRefreshing}>
          {isRefreshing ? "Actualisation..." : "Réessayer"}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Horaires d'ouverture</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshData} 
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? "Actualisation..." : "Actualiser"}
          </Button>
          <Button onClick={handleSave}>Enregistrer</Button>
        </div>
      </div>

      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Horaires de Livraison</h1>
        
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jour</TableHead>
                  <TableHead>Ouvert</TableHead>
                  <TableHead>Matin</TableHead>
                  <TableHead>Après-midi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localHours.map((hour) => (
                  <TableRow key={hour.id}>
                    <TableCell>{hour.day}</TableCell>
                    <TableCell>
                      <Switch
                        checked={hour.is_open}
                        onCheckedChange={() => handleToggleDay(hour.day_of_week)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={hour.morning_enabled}
                            onCheckedChange={() => handleToggleMorning(hour.day_of_week)}
                            disabled={!hour.is_open}
                          />
                          <Label>Actif</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={String(hour.morning_start || '')}
                            onValueChange={(value) => handleTimeChange(hour.day_of_week, 'morning_start', value)}
                            disabled={!hour.is_open || !hour.morning_enabled}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Début" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {timeOptions.map((time) => (
                                <SelectItem key={`morning-start-${hour.id}-${time}`} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span>-</span>
                          <Select
                            value={String(hour.morning_end || '')}
                            onValueChange={(value) => handleTimeChange(hour.day_of_week, 'morning_end', value)}
                            disabled={!hour.is_open || !hour.morning_enabled}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Fin" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {timeOptions.map((time) => (
                                <SelectItem key={`morning-end-${hour.id}-${time}`} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={hour.afternoon_enabled}
                            onCheckedChange={() => handleToggleAfternoon(hour.day_of_week)}
                            disabled={!hour.is_open}
                          />
                          <Label>Actif</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={String(hour.afternoon_start || '')}
                            onValueChange={(value) => handleTimeChange(hour.day_of_week, 'afternoon_start', value)}
                            disabled={!hour.is_open || !hour.afternoon_enabled}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Début" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {timeOptions.map((time) => (
                                <SelectItem key={`afternoon-start-${hour.id}-${time}`} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span>-</span>
                          <Select
                            value={String(hour.afternoon_end || '')}
                            onValueChange={(value) => handleTimeChange(hour.day_of_week, 'afternoon_end', value)}
                            disabled={!hour.is_open || !hour.afternoon_enabled}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Fin" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {timeOptions.map((time) => (
                                <SelectItem key={`afternoon-end-${hour.id}-${time}`} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}

