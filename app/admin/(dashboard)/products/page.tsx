"use client"

export const dynamic = 'force-dynamic'

// Cache'leme işlemlerini client side handle ediyoruz
// export const fetchCache = 'force-cache'

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2, Plus, Upload, X, Package } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { API_BASE_URL, getImageUrl } from "@/lib/api-config"
import { fetchWithAuth } from "@/lib/api"

const quantityTypes = ["kg", "g", "pièce", "bouquet", "barquette"]

interface ProductItem {
  name: string
  quantity: string
  origin?: string
}

interface ProductContent {
  name: string;
  quantity: string;
  origin: string;
}

interface Category {
  id: number
  name: string
  description: string
  isActive: boolean
}

interface Product {
  id: number
  name: string
  price: number
  category: {
    id: number
    name: string
  } | null
  quantity: number
  unit: string
  origin: string
  isActive: boolean
  description?: string
  image?: string
  contents?: ProductContent[]
  isComposite?: boolean
}

const initialProducts = [
  {
    id: 1,
    name: "Pommes Bio",
    price: 2.99,
    category: "Fruits",
    origin: "France",
    quantity: "1 kg",
    image: "/placeholder.svg",
  },
  {
    id: 2,
    name: "Carottes",
    price: 1.99,
    category: "Légumes",
    origin: "Espagne",
    quantity: "500 g",
    image: "/placeholder.svg",
  },
  {
    id: 3,
    name: "Laitue",
    price: 1.49,
    category: "Légumes",
    origin: "France",
    quantity: "1 pièce",
    image: "/placeholder.svg",
  },
]

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    categoryId: "",
    quantity: "",
    unit: "kg",
    origin: "",
    description: "",
    image: "",
    contents: [] as ProductContent[],
    isComposite: false,
    isActive: true
  })
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Ürünleri yükle
  const fetchProducts = async () => {
    try {
      // Benzersiz bir timestamp oluştur
      const timestamp = Date.now();
      
      // URL'e önbellek kırma parametresi ekle
      const url = `/api/admin/products?_=${timestamp}`;
      
      const response = await fetchWithAuth(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Fetch-Time': timestamp.toString()
        },
        signal: AbortSignal.timeout(10000) // 10 saniye timeout
      });
      
      if (!response.ok) throw new Error("Erreur de chargement");
      
      const data = await response.json();
      
      // API'den gelen veriyi map ile dönüştür (snake_case -> camelCase ve tipler)
      const transformedProducts = data.map((productData: any) => ({
        id: productData.id,
        name: productData.name,
        price: Number(productData.price || 0),
        category: productData.category ? { id: productData.category.id, name: productData.category.name } : null,
        quantity: Number(productData.quantity || 0),
        unit: productData.unit,
        origin: productData.origin,
        isActive: productData.is_active,
        description: productData.description,
        image: productData.image,
        contents: productData.contents,
        isComposite: productData.is_composite,
      }));
      
      setProducts(transformedProducts); // Dönüştürülmüş veriyi state'e ata
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive",
      });
    }
  };
  
  // Kategorileri getir
  const fetchCategories = async () => {
    try {
      // Benzersiz bir timestamp oluştur
      const timestamp = Date.now();
      
      // URL'e önbellek kırma parametresi ekle
      const url = `/api/admin/categories?_=${timestamp}`;
      
      const response = await fetchWithAuth(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Fetch-Time': timestamp.toString()
        }
      });
      
      if (!response.ok) throw new Error("Erreur de chargement des catégories");
      
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les catégories",
        variant: "destructive",
      });
    }
  }

  // Component yüklendiğinde hem ürünleri hem kategorileri getir
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    
    // Otomatik yenileme interval'i kaldırıldı çünkü on-demand revalidation kullanılacak
    // Artık ürünler, API'den gelen revalidate isteği ile güncellenecek
    
    // On-demand revalidation sırasında zaman zaman manuel yenileme için
    const intervalId = setInterval(() => {
      fetchProducts();
    }, 30000); // 5 saniyeden 30 saniyeye çıkarıldı
    
    // Component unmount olduğunda interval'i temizle
    return () => clearInterval(intervalId);
  }, []);

  // Düzenlenen ürün değiştiğinde form verilerini güncelle
  useEffect(() => {
    if (editingProduct) {
      setNewProduct({
        name: editingProduct.name,
        price: editingProduct.price.toString(),
        categoryId: editingProduct.category?.id.toString() || "",
        quantity: editingProduct.quantity.toString(),
        unit: editingProduct.unit,
        origin: editingProduct.origin || "",
        description: editingProduct.description || "",
        image: editingProduct.image || "",
        contents: editingProduct.contents || [],
        isComposite: editingProduct.isComposite || false,
        isActive: editingProduct.isActive
      });
    }
  }, [editingProduct]);

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

	//handleFileChange fonksiyonunu güncelle
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Dosya boyutu kontrolü (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "La taille de l'image doit être inférieure à 5 Mo",
          variant: "destructive",
        })
	// Input'u temizle
        if (event.target) event.target.value = '';
        return
      }

      // Resim tipini kontrol et
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un fichier image valide",
          variant: "destructive",
        })
	// Input'u temizle
        if (event.target) event.target.value = '';
        return
      }
      // Sıkıştırma kaldırıldı. Sadece önizleme için bir URL oluştur (isteğe bağlı)
      // ve/veya dosyanın seçildiğini belirten bir state güncellemesi yapabilirsiniz.
      // Şimdilik sadece dosya input'unun dolu olduğunu biliyoruz.
      // Önizleme için state'i güncelleyelim:
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      }
      reader.readAsDataURL(file);
      // Not: State'de hala base64 olacak ama gönderme mantığı bunu kullanmayacak.
 

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du traitement de l'image",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setNewProduct({ ...newProduct, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const formData = new FormData()
      formData.append('name', newProduct.name)
      formData.append('price', String(parseFloat(newProduct.price)))
      formData.append('category_id', String(parseInt(newProduct.categoryId)))
      
      // İçerik kontrolü - ürün içeriği varsa otomatik olarak bileşik ürün kabul et
      const hasContents = newProduct.contents && newProduct.contents.length > 0;
      const isComposite = newProduct.isComposite || hasContents;
      
      // Eğer bileşik ürün değilse quantity ve unit ekle
      if (!isComposite) {
        formData.append('quantity', String(parseFloat(newProduct.quantity)))
        formData.append('unit', newProduct.unit)
      } else {
        // Bileşik ürünler için varsayılan değerler
        formData.append('quantity', "1")
        formData.append('unit', "pc")
      }
      
      formData.append('origin', newProduct.origin || '')
      formData.append('description', newProduct.description || '')
      
      
      // isActive değerini newProduct'tan alalım
      formData.append('isComposite', String(isComposite))
      formData.append('isActive', String(newProduct.isActive))

      // İçerikleri ekle - bileşik ürün olsun olmasın, içerik varsa ekle
      if (newProduct.contents && newProduct.contents.length > 0) {
        formData.append('contents', JSON.stringify(newProduct.contents))
      }
      // Resim kontrolü - Basitleştirildi
      const imageFile = fileInputRef.current?.files?.[0]; // Seçilen dosyayı al

      if (imageFile) {
        // Yeni dosya seçildiyse, onu gönder
        formData.append('image', imageFile);
        console.log("Yeni dosya gönderiliyor:", imageFile.name);
      } else if (editingProduct && newProduct.image && typeof newProduct.image === 'string' && newProduct.image.startsWith('/')) {
         // Eğer DÜZENLEME modundaysak ve YENİ dosya seçilmediyse,
         // ve state'de geçerli bir yol varsa, bu yolu imageUrl olarak gönder (resim değişmedi)
        formData.append('imageUrl', newProduct.image);
      console.log("Mevcut resim yolu gönderiliyor:", newProduct.image);
      } else if (editingProduct && (newProduct.image === null || newProduct.image === '')) {
         // Eğer DÜZENLEME modundaysak ve state'deki resim null/boş ise,
         // resmi kaldır flag'ini gönder (backend bunu işlemeli)
         formData.append('removeImage', 'true');
         console.log("Resim kaldırma isteği gönderiliyor.");
      }
      // Yeni ürün eklerken resim seçilmediyse hiçbir şey gönderilmez, backend null/placeholder atar.

      const endpoint = editingProduct 
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products'

      const response = await fetchWithAuth(endpoint, {
        method: editingProduct ? "PUT" : "POST",
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Une erreur s'est produite lors de l'opération")
      }

      await fetchProducts()
      setIsAddingProduct(false)
      setEditingProduct(null)
      resetForm()

      toast({
        title: "Succès",
        description: editingProduct ? "Produit mis à jour" : "Produit ajouté",
      })

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le produit: " + (error?.message || ''),
        variant: "destructive",
      })
      
      
      fetchProducts()
    }
  }

  const handleAddContent = () => {
    setNewProduct({
      ...newProduct,
      contents: [...newProduct.contents, { name: "", quantity: "", origin: "" }]
    })
  }

  const handleRemoveContent = (index: number) => {
    setNewProduct({
      ...newProduct,
      contents: newProduct.contents.filter((_, i) => i !== index)
    })
  }

  const handleContentChange = (index: number, field: keyof ProductContent, value: string) => {
    setNewProduct({
      ...newProduct,
      contents: newProduct.contents.map((content, i) => 
        i === index ? { ...content, [field]: value } : content
      )
    })
  }

  // Ürün sil
  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return

    try {
      const response = await fetchWithAuth(`/api/admin/products/${id}`, {
        method: "DELETE"
      })

      // Ürün siparişlerde kullanılıyorsa
      if (response.status === 400) {
        const data = await response.json()
        
        if (data.usedInOrders) {
          // Zorla silme seçeneği sun
          if (confirm("Ce produit est utilisé dans des commandes. Voulez-vous quand même le supprimer ?")) {
            // Force parametresi ile tekrar dene
            const forceResponse = await fetchWithAuth(`/api/admin/products/${id}?force=true`, {
              method: "DELETE"
            })
            
            if (!forceResponse.ok) throw new Error("Erreur lors de la suppression forcée")
            
            await fetchProducts()
            toast({
              title: "Succès",
              description: "Produit supprimé avec succès",
            })
            return
          } else {
            // Kullanıcı vazgeçti
            return
          }
        }
        
        throw new Error(data.error || "Erreur lors de la suppression")
      }
      
      if (!response.ok) throw new Error("Erreur lors de la suppression")

      // Ürünleri hemen yenile
      await fetchProducts()
      toast({
        title: "Succès",
        description: "Produit supprimé avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive",
      })
      // Hata olsa bile listeyi yenilemeyi dene
      fetchProducts()
    }
  }

  // resetForm fonksiyonunu ekle
  const resetForm = () => {
    setNewProduct({
      name: "",
      price: "",
      categoryId: "",
      quantity: "",
      unit: "kg",
      origin: "",
      description: "",
      image: "",
      contents: [],
      isComposite: false,
      isActive: true
    })
    
    // Dosya input'unu da sıfırla
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleEditProduct = async (productId: number) => {
    try {
      // API'den ürün detaylarını getir - içerik bilgilerini doğru almak için
      const response = await fetchWithAuth(`/api/admin/products/${productId}`);
      if (!response.ok) {
        throw new Error("Ürün bilgileri alınamadı");
      }
      
      const productToEdit = await response.json();
      
      // Ürünün içerikleri varsa kesinlikle bileşik ürün olarak işaretle
      const hasContents = Array.isArray(productToEdit.contents) && productToEdit.contents.length > 0;
      const isComposite = Boolean(productToEdit.is_composite) || hasContents;
      
      // Ürün verilerini form formata dönüştür
      setEditingProduct({
        id: productToEdit.id,
        name: productToEdit.name,
        price: productToEdit.price,
        category: {
          id: productToEdit.category_id,
          name: productToEdit.category?.name || "Catégorie inconnue"
        },
        quantity: productToEdit.quantity,
        unit: productToEdit.unit,
        origin: productToEdit.origin || "",
        isActive: productToEdit.is_active,
        description: productToEdit.description || "",
        image: productToEdit.image || "",
        isComposite: isComposite, // Hem API hem de içerik kontrolüne göre değer
        contents: Array.isArray(productToEdit.contents) 
          ? productToEdit.contents.map((content: any) => ({
              name: content.name || "",
              quantity: content.quantity || "",
              origin: content.origin || ""
            }))
          : []
      });
      
      setIsAddingProduct(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du produit",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Produits</h1>
        <Button onClick={() => {
          setEditingProduct(null)
          setIsAddingProduct(true)
          resetForm()
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un produit
        </Button>
      </div>

      <Dialog open={isAddingProduct} onOpenChange={(open) => {
        setIsAddingProduct(open)
        if (!open) setEditingProduct(null)
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Modifier le produit" : "Ajouter un produit"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "Modifiez les détails du produit" : "Ajoutez un nouveau produit à votre catalogue"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Nom du produit</Label>
              <Input
                id="productName"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productCategory">Catégorie</Label>
              <Select
                value={newProduct.categoryId}
                onValueChange={(value) => {
                  setNewProduct({ ...newProduct, categoryId: value })
                }}
              >
                <SelectTrigger id="productCategory">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="productPrice">Prix</Label>
              <Input
                id="productPrice"
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productUnit">Unité</Label>
                <Select
                  value={newProduct.unit}
                  onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}
                  disabled={newProduct.isComposite || newProduct.contents?.length > 0}
                >
                  <SelectTrigger id="productUnit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quantityTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(newProduct.isComposite || newProduct.contents?.length > 0) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    L'unité est automatiquement définie pour les produits composés
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="productQuantity">Quantité</Label>
                <Input
                  id="productQuantity"
                  type="number"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                  disabled={newProduct.isComposite || newProduct.contents?.length > 0}
                  required={!newProduct.isComposite && !newProduct.contents?.length}
                />
                {(newProduct.isComposite || newProduct.contents?.length > 0) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    La quantité est automatiquement définie pour les produits composés
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="productOrigin">Origine</Label>
              <Input
                id="productOrigin"
                value={newProduct.origin}
                onChange={(e) => setNewProduct({ ...newProduct, origin: e.target.value })}
                disabled={newProduct.isComposite || Boolean(newProduct.contents?.length)}
              />
              {(newProduct.isComposite || newProduct.contents?.length > 0) && (
                <p className="text-xs text-muted-foreground mt-1">
                  L'origine n'est pas définie pour les produits composés
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="productImage">Image</Label>
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={handleFileSelect}>
                  <Upload className="w-4 h-4 mr-2" />
                  Choisir une image
                </Button>
                {newProduct.image && typeof newProduct.image === 'string' && newProduct.image.trim() !== '' && newProduct.image !== 'null' && newProduct.image !== 'undefined' && newProduct.image !== 'NaN' ? (
                  <img 
                    src={getImageUrl(newProduct.image)}
                    alt="Aperçu" 
                    width={40} 
                    height={40} 
                    className="rounded-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                    <Package size={20} />
                  </div>
                )}
              </div>
              <input
                id="productImage"
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isCompositeSwitch"
                checked={newProduct.isComposite || Boolean(newProduct.contents?.length)}
                onCheckedChange={(checked) => {
                  handleInputChange("isComposite", checked)
                  if (!checked) {
                    setNewProduct(prev => ({ ...prev, contents: [] }))
                  }
                }}
              />
              <Label htmlFor="isCompositeSwitch">Ce produit contient plusieurs éléments</Label>
            </div>
            {(newProduct.isComposite || newProduct.contents?.length > 0) && (
              <div className="space-y-4 mt-4">
                <Label>Contenu du produit</Label>
                {newProduct.contents.map((content, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Input
                      placeholder="Nom de l'élément"
                      value={content.name}
                      onChange={(e) => handleContentChange(index, "name", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Quantité"
                      value={content.quantity}
                      onChange={(e) => handleContentChange(index, "quantity", e.target.value)}
                      className="w-24"
                    />
                    <Input
                      placeholder="Origine"
                      value={content.origin}
                      onChange={(e) => handleContentChange(index, "origin", e.target.value)}
                      className="w-32"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveContent(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleAddContent}
                >
                  + Ajouter un élément
                </Button>
              </div>
            )}
            <DialogFooter>
              <Button type="submit">
                {editingProduct ? "Mettre à jour" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Actif</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Origine</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <Switch 
                      checked={product.isActive} 
                      onCheckedChange={async (checked) => {
                        try {
                          const response = await fetchWithAuth(
                            `/api/admin/products/${product.id}/toggle-active`,
                            {
                              method: "PUT",
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isActive: checked })
                            }
                          )
                          
                          if (!response.ok) throw new Error("Güncelleme başarısız")
                          
                          setProducts(prevProducts =>
                            prevProducts.map(p =>
                              p.id === product.id ? { ...p, isActive: checked } : p
                            )
                          )
                          
                          toast({
                            title: "Succès",
                            description: `Produit ${checked ? 'activé' : 'désactivé'}`,
                          })
                        } catch (error) {
                          toast({
                            title: "Erreur",
                            description: "Une erreur s'est produite lors de la mise à jour du statut du produit",
                            variant: "destructive",
                          })
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {product.image && typeof product.image === 'string' && product.image.trim() !== '' && product.image !== 'null' && product.image !== 'undefined' && product.image !== 'NaN' ? (
                      <img 
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                        <Package size={20} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category?.name || 'Sans catégorie'}</TableCell>
                  <TableCell>{product.price}€</TableCell>
                  <TableCell>{product.quantity} {product.unit}</TableCell>
                  <TableCell>{product.origin}</TableCell>
                  <TableCell className="space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditProduct(product.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

