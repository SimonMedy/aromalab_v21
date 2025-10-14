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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2, Search, Eye } from "lucide-react"
import {
  getFormulas,
  addFormula,
  updateFormula,
  deleteFormula,
  getRawMaterials,
  type Formula,
  type RawMaterial,
  formatFormulaCode,
  formatMaterialCode,
  getNextFormulaCode,
} from "@/lib/data-store"
import { useAuth } from "@/components/auth-provider"
import { addActivityLog } from "@/lib/data-store"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

interface FormulaIngredient {
  materialId: string
  quantity: number
}

export default function FormulasPage() {
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [filteredFormulas, setFilteredFormulas] = useState<Formula[]>([])
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null)
  const [viewingFormula, setViewingFormula] = useState<Formula | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formulaToDelete, setFormulaToDelete] = useState<Formula | null>(null)
  const [ingredients, setIngredients] = useState<FormulaIngredient[]>([{ materialId: "", quantity: 0 }])
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleteMultipleDialogOpen, setIsDeleteMultipleDialogOpen] = useState(false)

  const { user } = useAuth()
  const { toast } = useToast()

  const isAdmin = user?.role === "admin"

  useEffect(() => {
    loadFormulas()
    loadMaterials()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFormulas(formulas)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = formulas.filter(
        (f) =>
          f.code.toLowerCase().includes(query) ||
          f.name.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query),
      )
      setFilteredFormulas(filtered)
    }
  }, [searchQuery, formulas])

  const loadFormulas = () => {
    const data = getFormulas()
    setFormulas(data)
    setFilteredFormulas(data)
  }

  const loadMaterials = () => {
    const data = getRawMaterials()
    setMaterials(data)
  }

  const calculateTotal = () => {
    return ingredients.reduce((sum, ing) => sum + (ing.quantity || 0), 0)
  }

  const calculateFormulaTotal = (formula: Formula) => {
    return formula.ingredients.reduce((sum, ing) => sum + ing.quantity, 0)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const validIngredients = ingredients.filter((ing) => ing.materialId && ing.quantity > 0)
    if (validIngredients.length === 0) {
      toast({
        title: "Erreur de formulation",
        description: "Vous devez ajouter au moins un ingrédient.",
        variant: "destructive",
      })
      return
    }

    const total = calculateTotal()
    const formulaData = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      ingredients: validIngredients,
      totalWeight: total,
    }

    if (editingFormula) {
      updateFormula(editingFormula.id, formulaData)
      addActivityLog({
        userId: user!.id,
        userName: user!.name,
        action: "Modification",
        entity: "formula",
        entityId: editingFormula.id,
        details: `Formule ${formatFormulaCode(formulaData.code)} modifiée`,
      })
      toast({
        title: "Formule modifiée",
        description: `${formatFormulaCode(formulaData.code)} a été mise à jour avec succès.`,
      })
    } else {
      const newFormula = addFormula(formulaData)
      addActivityLog({
        userId: user!.id,
        userName: user!.name,
        action: "Création",
        entity: "formula",
        entityId: newFormula.id,
        details: `Formule ${formatFormulaCode(formulaData.code)} créée`,
      })
      toast({
        title: "Formule créée",
        description: `${formatFormulaCode(formulaData.code)} a été ajoutée avec succès.`,
      })
    }

    loadFormulas()
    setIsDialogOpen(false)
    setEditingFormula(null)
    setIngredients([{ materialId: "", quantity: 0 }])
  }

  const handleEdit = (formula: Formula) => {
    setEditingFormula(formula)
    setIngredients(formula.ingredients.length > 0 ? formula.ingredients : [{ materialId: "", quantity: 0 }])
    setIsDialogOpen(true)
  }

  const handleView = (formula: Formula) => {
    setViewingFormula(formula)
    setIsViewDialogOpen(true)
  }

  const handleDeleteClick = (formula: Formula) => {
    setFormulaToDelete(formula)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (formulaToDelete) {
      deleteFormula(formulaToDelete.id)
      addActivityLog({
        userId: user!.id,
        userName: user!.name,
        action: "Suppression",
        entity: "formula",
        entityId: formulaToDelete.id,
        details: `Formule ${formatFormulaCode(formulaToDelete.code)} supprimée`,
      })
      toast({
        title: "Formule supprimée",
        description: `${formatFormulaCode(formulaToDelete.code)} a été supprimée avec succès.`,
        variant: "destructive",
      })
      loadFormulas()
    }
    setIsDeleteDialogOpen(false)
    setFormulaToDelete(null)
  }

  const handleAddNew = () => {
    setEditingFormula(null)
    setIngredients([{ materialId: "", quantity: 0 }])
    setIsDialogOpen(true)
  }

  const addIngredient = () => {
    setIngredients([...ingredients, { materialId: "", quantity: 0 }])
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: "materialId" | "quantity", value: string | number) => {
    const newIngredients = [...ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }
    setIngredients(newIngredients)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredFormulas.map((f) => f.id))
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
    selectedIds.forEach((id) => {
      const formula = formulas.find((f) => f.id === id)
      if (formula) {
        deleteFormula(id)
        addActivityLog({
          userId: user!.id,
          userName: user!.name,
          action: "Suppression",
          entity: "formula",
          entityId: id,
          details: `Formule ${formatFormulaCode(formula.code)} supprimée`,
        })
      }
    })

    toast({
      title: "Formules supprimées",
      description: `${selectedIds.length} formule${selectedIds.length > 1 ? "s" : ""} supprimée${selectedIds.length > 1 ? "s" : ""} avec succès.`,
      variant: "destructive",
    })

    loadFormulas()
    setSelectedIds([])
    setIsDeleteMultipleDialogOpen(false)
  }

  const isAllSelected = filteredFormulas.length > 0 && selectedIds.length === filteredFormulas.length
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < filteredFormulas.length

  const getMaterialName = (materialId: string) => {
    const material = materials.find((m) => m.id === materialId)
    return material ? `${formatMaterialCode(material.code)} - ${material.designation}` : "Inconnu"
  }

  const total = calculateTotal()
  const isValidTotal = Math.abs(total - 100) < 0.01

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-balance">Formules d'arômes</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gestion des compositions et recettes</p>
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
              Nouvelle formule
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle>Liste des formules</CardTitle>
              <CardDescription>
                {filteredFormulas.length} formule{filteredFormulas.length > 1 ? "s" : ""} au total
              </CardDescription>
            </div>
            <div className="relative w-full min-w-0 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
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
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Ingrédients</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFormulas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="h-24 text-center">
                      {searchQuery ? "Aucun résultat trouvé." : "Aucune formule."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFormulas.map((formula) => {
                    const formulaTotal = calculateFormulaTotal(formula)
                    const isInvalid = Math.abs(formulaTotal - 100) > 0.01
                    const isSelected = selectedIds.includes(formula.id)
                    return (
                      <TableRow key={formula.id}>
                        {isAdmin && (
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectOne(formula.id, checked as boolean)}
                              aria-label={`Sélectionner ${formatFormulaCode(formula.code)}`}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-mono font-semibold">{formatFormulaCode(formula.code)}</TableCell>
                        <TableCell className="font-medium">{formula.name}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {formula.description}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{formula.ingredients.length}</Badge>
                        </TableCell>
                        <TableCell className={`text-center font-mono ${isInvalid ? "text-red-600 font-semibold" : ""}`}>
                          {formulaTotal.toFixed(2)} kg
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleView(formula)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(formula)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(formula)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingFormula ? "Modifier la formule" : "Nouvelle formule"}</DialogTitle>
                <DialogDescription>
                  {editingFormula ? "Modifiez les informations de la formule." : "Créez une nouvelle formule d'arôme."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Code (numéro) *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">F</span>
                    <Input
                      id="code"
                      name="code"
                      type="number"
                      min="1"
                      placeholder={editingFormula ? editingFormula.code : getNextFormulaCode()}
                      defaultValue={editingFormula?.code}
                      required
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Entrez uniquement le numéro (ex: 1, 2, 3...). Le préfixe F sera ajouté automatiquement.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Arôme vanille, Menthe fraîche..."
                    defaultValue={editingFormula?.name}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Description de la formule..."
                    defaultValue={editingFormula?.description}
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Ingrédients *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                      <Plus className="mr-1 h-3 w-3" />
                      Ajouter
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {ingredients.map((ingredient, index) => (
                      <div key={index} className="flex gap-2">
                        <Popover
                          open={openComboboxIndex === index}
                          onOpenChange={(open) => setOpenComboboxIndex(open ? index : null)}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openComboboxIndex === index}
                              className="flex-1 justify-between bg-transparent"
                            >
                              {ingredient.materialId
                                ? getMaterialName(ingredient.materialId)
                                : "Sélectionner une matière..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command>
                              <CommandInput placeholder="Rechercher une matière première..." />
                              <CommandList>
                                <CommandEmpty>Aucune matière trouvée.</CommandEmpty>
                                <CommandGroup>
                                  {materials.map((material) => (
                                    <CommandItem
                                      key={material.id}
                                      value={`${formatMaterialCode(material.code)} ${material.designation}`}
                                      onSelect={() => {
                                        updateIngredient(index, "materialId", material.id)
                                        setOpenComboboxIndex(null)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          ingredient.materialId === material.id ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                      {formatMaterialCode(material.code)} - {material.designation}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="Quantité (kg)"
                          value={ingredient.quantity || ""}
                          onChange={(e) => updateIngredient(index, "quantity", Number.parseFloat(e.target.value) || 0)}
                          className="w-32"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeIngredient(index)}
                          disabled={ingredients.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between rounded-lg border bg-muted p-3">
                    <span className="font-medium">Total :</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-lg font-bold ${isValidTotal ? "text-green-600" : "text-amber-600"}`}
                      >
                        {total.toFixed(2)} kg
                      </span>
                      {isValidTotal ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Valide
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          Total ≠ 100 kg
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">{editingFormula ? "Enregistrer" : "Créer"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de la formule</DialogTitle>
            <DialogDescription>
              Composition complète de {viewingFormula && formatFormulaCode(viewingFormula.code)}
            </DialogDescription>
          </DialogHeader>
          {viewingFormula && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Code :</span>
                  <span className="font-mono font-semibold">{formatFormulaCode(viewingFormula.code)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Nom :</span>
                  <span className="font-medium">{viewingFormula.name}</span>
                </div>
                {viewingFormula.description && (
                  <div className="grid gap-1">
                    <span className="text-sm font-medium text-muted-foreground">Description :</span>
                    <p className="text-sm">{viewingFormula.description}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Composition :</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matière première</TableHead>
                        <TableHead className="text-right">Quantité (kg)</TableHead>
                        <TableHead className="text-right">Pourcentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingFormula.ingredients.map((ingredient, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{getMaterialName(ingredient.materialId)}</TableCell>
                          <TableCell className="text-right font-mono">{ingredient.quantity.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono">
                            {((ingredient.quantity / viewingFormula.totalWeight) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted font-semibold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right font-mono">{viewingFormula.totalWeight.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isAdmin && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer la formule{" "}
                <span className="font-semibold">{formulaToDelete && formatFormulaCode(formulaToDelete.code)}</span> ?
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
      )}

      {isAdmin && (
        <Dialog open={isDeleteMultipleDialogOpen} onOpenChange={setIsDeleteMultipleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression multiple</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer{" "}
                <span className="font-semibold">
                  {selectedIds.length} formule{selectedIds.length > 1 ? "s" : ""}
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
      )}
    </div>
  )
}
