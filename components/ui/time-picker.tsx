"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  selectedDate?: Date
  availableSlots: string[]
  disabled?: boolean
}

export function TimePicker({ value, onChange, selectedDate, availableSlots, disabled }: TimePickerProps) {
  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled || availableSlots.length === 0}
    >
      <SelectTrigger className="bg-white hover:bg-gray-50 border-gray-200">
        <SelectValue placeholder="Sélectionnez une heure" />
      </SelectTrigger>
      <SelectContent className="max-h-[200px]">
        {availableSlots.length === 0 ? (
          <SelectItem value="no-slots" disabled>
            Aucun créneau disponible
          </SelectItem>
        ) : (
          availableSlots.map((time) => (
            <SelectItem 
              key={time} 
              value={time}
              className="hover:bg-gray-100"
            >
              {time}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
} 