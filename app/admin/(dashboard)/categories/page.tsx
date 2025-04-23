"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { fetchWithAuth } from "@/lib/api";

interface Category {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  is_default?: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await fetchWithAuth("/api/admin/categories", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        method: 'GET',
        signal: AbortSignal.timeout(10000) // 10 secondes timeout
      });
      
      if (!response.ok) throw new Error("Erreur lors du chargement des catégories");
      const data = await response.json();
      
      // Trier les catégories par ID
      const sortedCategories = data.sort((a: Category, b: Category) => a.id - b.id);
      setCategories(sortedCategories);
    } catch (error) {
      console.error("Erreur de chargement des catégories:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du chargement des catégories",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCategories();
    
    // Actualiser automatiquement les catégories toutes les 15 secondes
    const intervalId = setInterval(() => {
      fetchCategories();
    }, 15000);
    
    // Nettoyer l'intervalle lorsque le composant est démonté
    return () => clearInterval(intervalId);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setNewCategory({ ...newCategory, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetchWithAuth("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategory.name,
          description: newCategory.description,
          is_active: true // Toujours défini comme actif
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "L'opération a échoué");
      }

      // Fermer le modal
      setIsAddingCategory(false);
      
      // Réinitialiser les champs du formulaire
      setNewCategory({
        name: "",
        description: ""
      });
      
      // Actualiser immédiatement les catégories
      await fetchCategories();
      
      toast({
        title: "Succès",
        description: "Catégorie ajoutée",
      });
    } catch (error) {
      console.error("Erreur d'opération de catégorie:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "L'opération a échoué",
        variant: "destructive",
      });
      
      // Essayer de rafraîchir la liste même en cas d'erreur
      fetchCategories();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    // Empêcher la suppression des catégories avec les 5 premiers IDs
    if (id <= 5) {
      toast({
        title: "Opération bloquée",
        description: "Les catégories par défaut ne peuvent pas être supprimées",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie?")) return;

    try {
      const response = await fetchWithAuth(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.usedInProducts) {
          alert("Cette catégorie est utilisée par des produits et ne peut pas être supprimée pour le moment. Veuillez d'abord déplacer les produits associés vers une autre catégorie.");
          return;
        }
        
        throw new Error(errorData.error || "Échec de l'opération de suppression");
      }

      // Actualiser immédiatement les catégories
      await fetchCategories();
      
      toast({
        title: "Succès",
        description: "Catégorie supprimée avec succès",
      });
    } catch (error) {
      console.error("Erreur de suppression de catégorie:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec de l'opération de suppression",
        variant: "destructive",
      });
      
      // Essayer de rafraîchir la liste même en cas d'erreur
      fetchCategories();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Catégories</h1>
        <Button onClick={() => {
          setNewCategory({
            name: "",
            description: ""
          });
          setIsAddingCategory(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Catégorie
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nom de Catégorie</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>{category.id}</TableCell>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>{category.description || "-"}</TableCell>
              <TableCell className="text-right">
                <Button 
                  onClick={() => handleDeleteCategory(category.id)}
                  disabled={category.id <= 5}
                  className="bg-white hover:bg-destructive/10 text-destructive hover:text-destructive h-9 w-9 rounded-full p-0 shadow-sm"
                  aria-label="Supprimer la catégorie"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une Nouvelle Catégorie</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nom de Catégorie
                </Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={newCategory.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                onClick={() => {
                  setIsAddingCategory(false);
                }}
                className="border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Ajout en cours..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 