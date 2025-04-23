"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDeliveryHours, formatDeliveryHours } from '@/lib/delivery-hours'

interface DeliveryInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DeliveryInfoModal({ isOpen, onClose }: DeliveryInfoModalProps) {
  const { hours, fetchHours } = useDeliveryHours()

  useEffect(() => {
    fetchHours()
  }, [fetchHours])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Heures d'Ouverture</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <table className="w-full">
            <tbody>
              {hours.map((hour, index) => (
                <tr key={`${hour.day}-${index}`} className="border-b last:border-b-0">
                  <td className="py-2 font-semibold">{hour.day}</td>
                  <td className="py-2 text-right">{formatDeliveryHours(hour)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )
}

