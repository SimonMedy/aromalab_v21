"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, Search, PackagePlus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  getRawMaterials,
  addRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
  type RawMaterial,
  formatMaterialCode,
  getNextMaterialCode,
  getFormulasUsingMaterial,
  formatFormulaCode,
} from "@/lib/data-store"
import { useAuth } from "@/components/auth-provider"
import { addActivityLog } from "@/lib/data-store"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

type StockFilter = "all" | "in-stock" | "low-20" | "low-5" | "out-of-stock"

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<RawMaterial[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [stockFilter, setStockFilter] = useState<StockFilter>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState<RawMaterial | null>(null)
  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false)
  const [materialForStock, setMaterialForStock] = useState<RawMaterial | null>(null)
  const [stockToAdd, setStockToAdd] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleteMultipleDialogOpen, setIsDeleteMultipleDialogOpen] = useState(false)

  const { user } = useAuth()
  const { toast } = useToast()

  const isAdmin = user?.role === "admin"

  useEffect(() => {
    loadMaterials()
  }, [])

  useEffect(() => {
    let filtered = materials

    // Appliquer le filtre de stock
    if (stockFilter !== "all") {
      filtered = filtered.filter((m) => {
        switch (stockFilter) {
          case "in-stock":
            return m.stock > 0
          case "low-20":
            return m.stock > 0 && m.stock <= 0.02 // 20g = 0.02kg
          case "low-5":
            return m.stock > 0 && m.stock <= 0.005 // 5g = 0.005kg
          case "out-of-stock":
            return m.stock <= 0
          default:
            return true
        }
      })
    }

    // Appliquer la recherche
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.code.toLowerCase().includes(query) ||
          m.designation.toLowerCase().includes(query) ||
          m.cas.toLowerCase().includes(query) ||
          m.supplier.toLowerCase().includes(query),
      )
    }

    setFilteredMaterials(filtered)
  }, [searchQuery, stockFilter, materials])

  const loadMaterials = () => {
    const data = getRawMaterials()
    setMaterials(data)
    setFilteredMaterials(data)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const materialData = {
      code: formData.get("code") as string,
      designation: formData.get("designation") as string,
      cas: formData.get("cas") as string,
      supplier: formData.get("supplier") as string,
      stock: Number.parseFloat(formData.get("stock") as string),
      price: Number.parseFloat(formData.get("price") as string),
    }

    if (editingMaterial) {
      updateRawMaterial(editingMaterial.id, materialData)
      addActivityLog({
        userId: user!.id,
        userName: user!.name,
        action: "Modification",
        entity: "material",
        entityId: editingMaterial.id,
        details: `Matière première ${formatMaterialCode(materialData.code)} modifiée`,
      })
      toast({
        title: "Matière première modifiée",
        description: `${formatMaterialCode(materialData.code)} a été mise à jour avec succès.`,
      })
    } else {
      const newMaterial = addRawMaterial(materialData)
      addActivityLog({
        userId: user!.id,
        userName: user!.name,
        action: "Création",
        entity: "material",
        entityId: newMaterial.id,
        details: `Matière première ${formatMaterialCode(materialData.code)} créée`,
      })
      toast({
        title: "Matière première créée",
        description: `${formatMaterialCode(materialData.code)} a été ajoutée avec succès.`,
      })
    }

    loadMaterials()
    setIsDialogOpen(false)
    setEditingMaterial(null)
  }

  const handleEdit = (material: RawMaterial) => {
    setEditingMaterial(material)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (material: RawMaterial) => {
    setMaterialToDelete(material)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (materialToDelete) {
      const formulasUsing = getFormulasUsingMaterial(materialToDelete.id)

      if (formulasUsing.length > 0) {
        const formulaNames = formulasUsing.map((f) => `${formatFormulaCode(f.code)} - ${f.name}`).join(", ")
        toast({
          title: "Suppression impossible",
          description: `Cette matière première est utilisée dans ${formulasUsing.length} formule${formulasUsing.length > 1 ? "s" : ""} : ${formulaNames}. Veuillez d'abord retirer cette matière de ces formules.`,
          variant: "destructive",
        })
        setIsDeleteDialogOpen(false)
        setMaterialToDelete(null)
        return
      }

      deleteRawMaterial(materialToDelete.id)
      addActivityLog({
        userId: user!.id,
        userName: user!.name,
        action: "Suppression",
        entity: "material",
        entityId: materialToDelete.id,
        details: `Matière première ${formatMaterialCode(materialToDelete.code)} supprimée`,
      })
      toast({
        title: "Matière première supprimée",
        description: `${formatMaterialCode(materialToDelete.code)} a été supprimée avec succès.`,
        variant: "destructive",
      })
      loadMaterials()
    }
    setIsDeleteDialogOpen(false)
    setMaterialToDelete(null)
  }

  const handleAddNew = () => {
    setEditingMaterial(null)
    setIsDialogOpen(true)
  }

  const handleAddStockClick = (material: RawMaterial) => {
    setMaterialForStock(material)
    setStockToAdd("")
    setIsAddStockDialogOpen(true)
  }

  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!materialForStock || !stockToAdd) return

    const quantityToAdd = Number.parseFloat(stockToAdd)
    if (isNaN(quantityToAdd) || quantityToAdd <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une quantité valide.",
        variant: "destructive",
      })
      return
    }

    const newStock = materialForStock.stock + quantityToAdd
    updateRawMaterial(materialForStock.id, { stock: newStock })

    addActivityLog({
      userId: user!.id,
      userName: user!.name,
      action: "Ajout stock",
      entity: "material",
      entityId: materialForStock.id,
      details: `+${quantityToAdd.toFixed(2)} kg ajoutés à ${formatMaterialCode(materialForStock.code)} (nouveau stock: ${newStock.toFixed(2)} kg)`,
    })

    toast({
      title: "Stock ajouté",
      description: `${quantityToAdd.toFixed(2)} kg ajoutés à ${formatMaterialCode(materialForStock.code)}.`,
    })

    loadMaterials()
    setIsAddStockDialogOpen(false)
    setMaterialForStock(null)
    setStockToAdd("")
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredMaterials.map((m) => m.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id))
    }
  }

  const handleDeleteMultipleClick = () => {
    if (selectedIds.length === 0) return
    setIsDeleteMultipleDialogOpen(true)
  }

  const handleDeleteMultipleConfirm = () => {
    const materialsInUse: { material: RawMaterial; formulas: string[] }[] = []

    selectedIds.forEach((id) => {
      const material = materials.find((m) => m.id === id)
      if (material) {
        const formulasUsing = getFormulasUsingMaterial(id)
        if (formulasUsing.length > 0) {
          materialsInUse.push({
            material,
            formulas: formulasUsing.map((f) => `${formatFormulaCode(f.code)} - ${f.name}`),
          })
        }
      }
    })

    if (materialsInUse.length > 0) {
      const details = materialsInUse
        .map((item) => `${formatMaterialCode(item.material.code)} (utilisée dans: ${item.formulas.join(", ")})`)
        .join(" ; ")

      toast({
        title: "Suppression impossible",
        description: `${materialsInUse.length} matière${materialsInUse.length > 1 ? "s" : ""} ${materialsInUse.length > 1 ? "sont utilisées" : "est utilisée"} dans des formules : ${details}`,
        variant: "destructive",
      })
      setIsDeleteMultipleDialogOpen(false)
      return
    }

    selectedIds.forEach((id) => {
      const material = materials.find((m) => m.id === id)
      if (material) {
        deleteRawMaterial(id)
        addActivityLog({
          userId: user!.id,
          userName: user!.name,
          action: "Suppression",
          entity: "material",
          entityId: id,
          details: `Matière première ${formatMaterialCode(material.code)} supprimée`,
        })
      }
    })

    toast({
      title: "Matières premières supprimées",
      description: `${selectedIds.length} matière${selectedIds.length > 1 ? "s" : ""} supprimée${selectedIds.length > 1 ? "s" : ""} avec succès.`,
      variant: "destructive",
    })

    loadMaterials()
    setSelectedIds([])
    setIsDeleteMultipleDialogOpen(false)
  }

  const isAllSelected = filteredMaterials.length > 0 && selectedIds.length === filteredMaterials.length
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < filteredMaterials.length

  const getStockStatus = (stock: number) => {
    if (stock < 0.02) return { label: "Faible", variant: "destructive" as const } // < 20g
    if (stock < 0.1) return { label: "Moyen", variant: "default" as const } // < 100g
    if (stock < 0.5) return { label: "Bon", variant: "secondary" as const } // < 500g
    return { label: "Excellent", variant: "secondary" as const } // >= 500g
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-balance">Matières premières</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gestion du stock et des références</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {isAdmin && selectedIds.length > 0 && (
            <Button onClick={handleDeleteMultipleClick} variant="destructive" className="w-full sm:w-auto">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer ({selectedIds.length})
            </Button>
          )}
          {isAdmin && (
            <Button onClick={handleAddNew} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle matière
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1 min-w-[200px]">
                <CardTitle>Liste des matières premières</CardTitle>
                <CardDescription>
                  {filteredMaterials.length} matière{filteredMaterials.length > 1 ? "s" : ""} au total
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:min-w-[280px]">
                <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as StockFilter)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrer par stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="in-stock">En stock</SelectItem>
                    <SelectItem value="low-20">Stock ≤ 20g</SelectItem>
                    <SelectItem value="low-5">Stock ≤ 5g</SelectItem>
                    <SelectItem value="out-of-stock">Hors stock</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && (
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Tout sélectionner"
                        className={isSomeSelected ? "data-[state=checked]:bg-primary/50" : ""}
                      />
                    </TableHead>
                  )}
                  <TableHead>Code</TableHead>
                  <TableHead>Désignation</TableHead>
                  <TableHead>CAS</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-right">Stock (kg)</TableHead>
                  <TableHead className="text-right">Prix (€/kg)</TableHead>
                  <TableHead>Statut</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 9 : 7} className="h-24 text-center">
                      {searchQuery || stockFilter !== "all" ? "Aucun résultat trouvé." : "Aucune matière première."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaterials.map((material) => {
                    const stockStatus = getStockStatus(material.stock)
                    const isSelected = selectedIds.includes(material.id)
                    return (
                      <TableRow key={material.id}>
                        {isAdmin && (
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectOne(material.id, checked as boolean)}
                              aria-label={`Sélectionner ${formatMaterialCode(material.code)}`}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-mono font-semibold">{formatMaterialCode(material.code)}</TableCell>
                        <TableCell className="font-medium">{material.designation}</TableCell>
                        <TableCell className="font-mono text-sm">{material.cas}</TableCell>
                        <TableCell>{material.supplier}</TableCell>
                        <TableCell className="text-right font-mono">{material.stock.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">{material.price.toFixed(2)} €</TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAddStockClick(material)}
                                title="Ajouter du stock"
                              >
                                <PackagePlus className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(material)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(material)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddStockDialogOpen} onOpenChange={setIsAddStockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAddStockSubmit}>
            <DialogHeader>
              <DialogTitle>Ajouter du stock</DialogTitle>
              <DialogDescription>
                Ajoutez une quantité au stock de{" "}
                <span className="font-semibold">{materialForStock && formatMaterialCode(materialForStock.code)}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="currentStock">Stock actuel</Label>
                <Input
                  id="currentStock"
                  value={materialForStock ? `${materialForStock.stock.toFixed(2)} kg` : ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stockToAdd">Quantité à ajouter (kg) *</Label>
                <Input
                  id="stockToAdd"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="10.00"
                  value={stockToAdd}
                  onChange={(e) => setStockToAdd(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {stockToAdd && !isNaN(Number.parseFloat(stockToAdd)) && (
                <div className="grid gap-2">
                  <Label>Nouveau stock</Label>
                  <Input
                    value={
                      materialForStock
                        ? `${(materialForStock.stock + Number.parseFloat(stockToAdd)).toFixed(2)} kg`
                        : ""
                    }
                    disabled
                    className="bg-muted font-semibold"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddStockDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Ajouter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteMultipleDialogOpen} onOpenChange={setIsDeleteMultipleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression multiple</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer{" "}
              <span className="font-semibold">
                {selectedIds.length} matière{selectedIds.length > 1 ? "s" : ""} première
                {selectedIds.length > 1 ? "s" : ""}
              </span>{" "}
              ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteMultipleDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteMultipleConfirm}>
              Supprimer tout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour la modification de matière première */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? "Modifier la matière première" : "Nouvelle matière première"}
              </DialogTitle>
              <DialogDescription>
                {editingMaterial
                  ? "Modifiez les informations de la matière première."
                  : "Ajoutez une nouvelle matière première au catalogue."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Code (numéro) *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">MP</span>
                  <Input
                    id="code"
                    name="code"
                    type="number"
                    min="1"
                    placeholder={editingMaterial ? editingMaterial.code : getNextMaterialCode()}
                    defaultValue={editingMaterial?.code}
                    required
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Entrez uniquement le numéro (ex: 1, 2, 3...). Le préfixe MP sera ajouté automatiquement.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="designation">Désignation *</Label>
                <Input
                  id="designation"
                  name="designation"
                  placeholder="Vanilline, Menthol..."
                  defaultValue={editingMaterial?.designation}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cas">Numéro CAS *</Label>
                <Input id="cas" name="cas" placeholder="121-33-5" defaultValue={editingMaterial?.cas} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier">Fournisseur *</Label>
                <Input
                  id="supplier"
                  name="supplier"
                  placeholder="Givaudan, Symrise..."
                  defaultValue={editingMaterial?.supplier}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock (kg) *</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="100.00"
                    defaultValue={editingMaterial?.stock}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Prix (€/kg) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="45.50"
                    defaultValue={editingMaterial?.price}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">{editingMaterial ? "Enregistrer" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog pour la suppression d'une matière première */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la matière première{" "}
              <span className="font-semibold">{materialToDelete && formatMaterialCode(materialToDelete.code)}</span> ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
