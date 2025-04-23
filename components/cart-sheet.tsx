"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useCart } from "@/lib/cart"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Minus, Plus, Trash2 } from "lucide-react"
import { getImageUrl } from "@/lib/api-config";

export function CartSheet() {
  const { isOpen, setIsOpen, items, updateQuantity, removeFromCart, total } = useCart()

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Votre Panier</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full">
          <ScrollArea className="flex-grow">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 mt-4">Votre panier est vide</p>
            ) : (
              <div className="space-y-4 mt-4">
                {items.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                      <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-gray-50">
  			<img
    				src={getImageUrl(item.image) || "/placeholder.svg"}
    				alt={item.name}
    				className="h-full w-full object-cover"
    				loading="lazy"
    				onError={(e) => {
      					console.error("Resim yuklenemedi:", item.image);
				        e.currentTarget.src = "/placeholder.svg";
				        if (item.image && !item.image.startsWith('/products/') && !item.image.startsWith('/')) {
 					       e.currentTarget.src = `/products/${item.image}`;
					}
    				}}
			/>
		</div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.price.toFixed(2)} €</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.name, (item.quantity ?? 1) - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span>{item.quantity ?? 1}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.name, (item.quantity ?? 1) + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => removeFromCart(item.name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between mb-4">
              <span className="font-medium">Total estimé</span>
              <span className="font-medium">{total.toFixed(2)} €</span>
            </div>
            <Button className="w-full" disabled={items.length === 0}>
              Commander
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 
