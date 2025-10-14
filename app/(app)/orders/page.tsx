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
import { Plus, Search, CheckCircle, XCircle, Clock, Eye } from "lucide-react"
import {
  getManufacturingOrders,
  addManufacturingOrder,
  updateManufacturingOrder,
  completeManufacturingOrder,
  getFormulas,
  getRawMaterials,
  type ManufacturingOrder,
  type Formula,
  type RawMaterial,
  formatFormulaCode,
  formatMaterialCode,
} from "@/lib/data-store"
import { useAuth } from "@/components/auth-provider"
import { addActivityLog } from "@/lib/data-store"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function OrdersPage() {
  const [orders, setOrders] = useState<ManufacturingOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<ManufacturingOrder[]>([])
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<ManufacturingOrder | null>(null)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [orderToComplete, setOrderToComplete] = useState<ManufacturingOrder | null>(null)
  const [selectedFormulaId, setSelectedFormulaId] = useState("")
  const [coefficient, setCoefficient] = useState("1")
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadOrders()
    loadFormulas()
    loadMaterials()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOrders(orders)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = orders.filter(
        (o) => o.orderNumber.toLowerCase().includes(query) || getFormulaName(o.formulaId).toLowerCase().includes(query),
      )
      setFilteredOrders(filtered)
    }
  }, [searchQuery, orders])

  const loadOrders = () => {
    const data = getManufacturingOrders()
    // Sort by creation date, newest first
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setOrders(data)
    setFilteredOrders(data)
  }

  const loadFormulas = () => {
    const data = getFormulas()
    setFormulas(data)
  }

  const loadMaterials = () => {
    const data = getRawMaterials()
    setMaterials(data)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!selectedFormulaId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une formule.",
        variant: "destructive",
      })
      return
    }

    const coeffValue = Number.parseFloat(coefficient)
    if (isNaN(coeffValue) || coeffValue <= 0) {
      toast({
        title: "Erreur",
        description: "Le coefficient doit être un nombre positif.",
        variant: "destructive",
      })
      return
    }

    const newOrder = addManufacturingOrder({
      formulaId: selectedFormulaId,
      coefficient: coeffValue,
      status: "pending",
      createdBy: user!.id,
    })

    addActivityLog({
      userId: user!.id,
      userName: user!.name,
      action: "Création",
      entity: "order",
      entityId: newOrder.id,
      details: `Ordre de fabrication ${newOrder.orderNumber} créé`,
    })

    toast({
      title: "Ordre créé",
      description: `L'ordre ${newOrder.orderNumber} a été créé avec succès.`,
    })

    loadOrders()
    setIsDialogOpen(false)
    setSelectedFormulaId("")
    setCoefficient("1")
  }

  const handleCompleteClick = (order: ManufacturingOrder) => {
    setOrderToComplete(order)
    setIsCompleteDialogOpen(true)
  }

  const handleCompleteConfirm = () => {
    if (orderToComplete) {
      const success = completeManufacturingOrder(orderToComplete.id)

      if (success) {
        addActivityLog({
          userId: user!.id,
          userName: user!.name,
          action: "Complétion",
          entity: "order",
          entityId: orderToComplete.id,
          details: `Ordre de fabrication ${orderToComplete.orderNumber} complété`,
        })

        toast({
          title: "Ordre complété",
          description: `L'ordre ${orderToComplete.orderNumber} a été complété et le stock a été déduit.`,
        })

        loadOrders()
        loadMaterials()
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de compléter l'ordre.",
          variant: "destructive",
        })
      }
    }
    setIsCompleteDialogOpen(false)
    setOrderToComplete(null)
  }

  const handleCancelOrder = (orderId: string, orderNumber: string) => {
    updateManufacturingOrder(orderId, { status: "cancelled" })
    addActivityLog({
      userId: user!.id,
      userName: user!.name,
      action: "Annulation",
      entity: "order",
      entityId: orderId,
      details: `Ordre de fabrication ${orderNumber} annulé`,
    })

    toast({
      title: "Ordre annulé",
      description: `L'ordre ${orderNumber} a été annulé.`,
      variant: "destructive",
    })

    loadOrders()
  }

  const handleView = (order: ManufacturingOrder) => {
    setViewingOrder(order)
    setIsViewDialogOpen(true)
  }

  const getFormulaName = (formulaId: string) => {
    const formula = formulas.find((f) => f.id === formulaId)
    return formula ? `${formatFormulaCode(formula.code)} - ${formula.name}` : "Inconnu"
  }

  const getMaterialName = (materialId: string) => {
    const material = materials.find((m) => m.id === materialId)
    return material ? `${formatMaterialCode(material.code)} - ${material.designation}` : "Inconnu"
  }

  const getStatusBadge = (status: ManufacturingOrder["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="default">
            <Clock className="mr-1 h-3 w-3" />
            En attente
          </Badge>
        )
      case "in-progress":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            En cours
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Complété
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Annulé
          </Badge>
        )
    }
  }

  const selectedFormula = formulas.find((f) => f.id === selectedFormulaId)
  const coeffValue = Number.parseFloat(coefficient) || 0
  const totalProduction = coeffValue * 100

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-balance">Ordres de fabrication</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gestion de la production</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nouvel ordre
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="min-w-0 flex-1 sm:flex-none">
              <CardTitle>Liste des ordres</CardTitle>
              <CardDescription>
                {filteredOrders.length} ordre{filteredOrders.length > 1 ? "s" : ""} au total
              </CardDescription>
            </div>
            <div className="relative w-full min-w-[200px] sm:w-64">
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Ordre</TableHead>
                  <TableHead>Formule</TableHead>
                  <TableHead className="text-center">Coefficient</TableHead>
                  <TableHead className="text-right">Quantité (kg)</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {searchQuery ? "Aucun résultat trouvé." : "Aucun ordre de fabrication."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-semibold">{order.orderNumber}</TableCell>
                      <TableCell className="font-medium">{getFormulaName(order.formulaId)}</TableCell>
                      <TableCell className="text-center font-mono">{order.coefficient}</TableCell>
                      <TableCell className="text-right font-mono">{(order.coefficient * 100).toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(order.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleView(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCompleteClick(order)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Compléter
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelOrder(order.id, order.orderNumber)}
                                className="text-destructive hover:text-destructive"
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Annuler
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Nouvel ordre de fabrication</DialogTitle>
              <DialogDescription>
                Créez un ordre de fabrication en sélectionnant une formule et un coefficient.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="formula">Formule *</Label>
                <Select value={selectedFormulaId} onValueChange={setSelectedFormulaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une formule" />
                  </SelectTrigger>
                  <SelectContent>
                    {formulas.map((formula) => (
                      <SelectItem key={formula.id} value={formula.id}>
                        {formatFormulaCode(formula.code)} - {formula.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="coefficient">Coefficient *</Label>
                <Input
                  id="coefficient"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1.0"
                  value={coefficient}
                  onChange={(e) => setCoefficient(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Exemple : 0.1 pour produire 10 kg, 2 pour produire 200 kg
                </p>
              </div>

              {selectedFormula && coeffValue > 0 && (
                <div className="space-y-3 rounded-lg border bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Quantité totale à produire :</span>
                    <span className="text-lg font-bold">{totalProduction.toFixed(2)} kg</span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Matières nécessaires :</h4>
                    <div className="space-y-1">
                      {selectedFormula.ingredients.map((ingredient, index) => {
                        const material = materials.find((m) => m.id === ingredient.materialId)
                        const requiredQty = ingredient.quantity * coeffValue
                        const stockInfo = material ? ` (stock: ${material.stock.toFixed(2)} kg)` : ""

                        return (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{getMaterialName(ingredient.materialId)}</span>
                            <span className="font-mono">
                              {requiredQty.toFixed(2)} kg{stockInfo}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer l'ordre</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de l'ordre</DialogTitle>
            <DialogDescription>Informations complètes sur {viewingOrder?.orderNumber}</DialogDescription>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">N° Ordre :</span>
                  <span className="font-mono font-semibold">{viewingOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Formule :</span>
                  <span className="font-medium">{getFormulaName(viewingOrder.formulaId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Coefficient :</span>
                  <span className="font-mono">{viewingOrder.coefficient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Quantité produite :</span>
                  <span className="font-mono font-semibold">{(viewingOrder.coefficient * 100).toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Statut :</span>
                  {getStatusBadge(viewingOrder.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Date création :</span>
                  <span className="text-sm">
                    {format(new Date(viewingOrder.createdAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                  </span>
                </div>
                {viewingOrder.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Date complétion :</span>
                    <span className="text-sm">
                      {format(new Date(viewingOrder.completedAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Matières utilisées :</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matière première</TableHead>
                        <TableHead className="text-right">Quantité (kg)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const formula = formulas.find((f) => f.id === viewingOrder.formulaId)
                        return formula?.ingredients.map((ingredient, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{getMaterialName(ingredient.materialId)}</TableCell>
                            <TableCell className="text-right font-mono">
                              {(ingredient.quantity * viewingOrder.coefficient).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))
                      })()}
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

      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compléter l'ordre</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir compléter l'ordre{" "}
              <span className="font-semibold">{orderToComplete?.orderNumber}</span> ? Le stock des matières premières
              sera automatiquement déduit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCompleteConfirm}>Compléter l'ordre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
